// src/content/translator/translation-queue.ts — 翻译调度中心：批量通信、缓存、进度 | DocBridge | 2025-08-06

import type { TranslationUnit, TranslatedUnit, DTMessage } from '../../shared/types';

/** 批次间延迟（毫秒），避免触发限流 */
const BATCH_DELAY_MS = 100;

/** 并发批次数（同时发送的翻译请求数，SW 是单线程，设为 1 避免排队超时） */
const CONCURRENT_BATCHES = 1;

/** sendMessage 超时时间（毫秒），SW 单线程处理 DeepSeek API 需要 3-8s */
const MESSAGE_TIMEOUT_MS = 30000;

/** 翻译结果结构（background 通过 TRANSLATE_RESULT 返回） */
interface TranslateResultItem {
  id: string;
  translatedText: string;
}

/** 队列回调 */
interface QueueCallbacks {
  onProgress: (translatedCount: number, totalCount: number) => void;
  onComplete: (allResults: TranslatedUnit[]) => void;
  onError?: (error: Error) => void;
}

export class TranslationQueue {
  private onProgress: (translatedCount: number, totalCount: number) => void;
  private onComplete: (allResults: TranslatedUnit[]) => void;
  private onError?: (error: Error) => void;

  /** 防止 start() 重入 */
  private isRunning = false;

  constructor(callbacks: QueueCallbacks) {
    this.onProgress = callbacks.onProgress;
    this.onComplete = callbacks.onComplete;
    this.onError = callbacks.onError;
  }

  /**
   * 启动翻译：并发发送 3 个批次，等待结果、上报进度
   * 检测到扩展上下文失效后立即中止
   */
  async start(batches: TranslationUnit[][]): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const allResults: TranslatedUnit[] = [];
      let totalUnits = 0;
      for (const batch of batches) totalUnits += batch.length;
      let translatedCount = 0;

      // 并发窗口：每次处理 CONCURRENT_BATCHES 个批次
      for (let i = 0; i < batches.length; i += CONCURRENT_BATCHES) {
        if (!chrome.runtime?.id) {
          console.error('[DocBridge] 扩展上下文已失效，停止翻译队列');
          this.onError?.(new Error('扩展上下文已失效，请刷新页面后重试'));
          break;
        }

        const chunk = batches.slice(i, i + CONCURRENT_BATCHES);
        const startIndex = i;

        console.log(`[DocBridge] 并发翻译 批次 ${startIndex + 1}-${Math.min(startIndex + CONCURRENT_BATCHES, batches.length)}/${batches.length}`);

        // 并发处理当前窗口内的批次
        const chunkResults = await Promise.allSettled(
          chunk.map((batch, j) => this.processBatch(batch, startIndex + j))
        );

        // 收集结果
        for (const result of chunkResults) {
          if (result.status === 'fulfilled') {
            for (const r of result.value) {
              const original = batches.flat().find((u) => u.id === r.id);
              if (original) {
                allResults.push({
                  id: r.id,
                  translatedText: r.translatedText,
                  originalUnit: original,
                });
              }
            }
            translatedCount += result.value.length;
          }
        }

        this.onProgress(translatedCount, totalUnits);

        // 批次间短暂延迟，避免 API 限流
        if (i + CONCURRENT_BATCHES < batches.length) {
          await sleep(BATCH_DELAY_MS);
        }
      }

      this.onComplete(allResults);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 处理单个批次的翻译流程
   * 缓存由 background SW 的 TRANSLATE handler 内部处理，不单独逐条查询
   */
  private async processBatch(
    batch: TranslationUnit[],
    batchIndex: number
  ): Promise<TranslateResultItem[]> {
    try {
      const response = await this.sendMessage<{
        success: boolean;
        data?: TranslateResultItem[];
        error?: string;
      }>({
        type: 'TRANSLATE',
        payload: {
          units: batch.map((u) => ({
            id: u.id,
            text: u.originalText,
            contextChain: u.contextChain,
          })),
          glossary: {},
          targetLang: 'zh-CN',
        },
      });

      if (!response || !response.success) {
        throw new Error(response?.error ?? '翻译失败');
      }

      const translated = response.data ?? [];
      if (translated.length === 0) {
        console.warn(`[DocBridge] 批次 ${batchIndex + 1}: API 返回 0 条翻译结果`);
      } else {
        console.log(`[DocBridge] 批次 ${batchIndex + 1} 收到翻译结果:`, translated.length, '条');
      }
      return translated;
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      if (error.message.includes('Extension context invalidated')
          || error.message.includes('扩展上下文已失效')) {
        console.error(`[DocBridge] 翻译批次 ${batchIndex + 1} 失败 (上下文中止):`, error.message);
        this.onError?.(error);
        return [];
      }
      console.error(`[DocBridge] 翻译批次 ${batchIndex + 1} 失败:`, error.message);
      this.onError?.(error);
      return [];
    }
  }

  /** 销毁队列 */
  destroy(): void {
    return;
  }

  /**
   * 发送消息给 Service Worker，带超时保护
   * 超时或扩展上下文失效时抛出明确错误，避免 Promise 永久挂起
   */
  private sendMessage<T>(message: DTMessage): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        const msg = `消息 ${message.type} 超时 (${MESSAGE_TIMEOUT_MS}ms)，Service Worker 可能未启动`;
        console.error(`[DocBridge] ${msg}`);
        reject(new Error(msg));
      }, MESSAGE_TIMEOUT_MS);

      chrome.runtime.sendMessage(message, (response: T) => {
        clearTimeout(timer);
        if (settled) return;
        settled = true;
        if (chrome.runtime.lastError) {
          console.error(`[DocBridge] ${message.type} 失败:`, chrome.runtime.lastError.message);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
    });
  }
}

/**
 * 延迟工具函数
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
