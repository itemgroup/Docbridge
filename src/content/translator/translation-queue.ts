// src/content/translator/translation-queue.ts — 翻译调度中心：批量通信、缓存、进度 | DocBridge | 2025-08-06

import type { TranslationUnit, TranslatedUnit, DTMessage } from '../../shared/types';

/** 批次间延迟（毫秒），避免触发限流 */
const BATCH_DELAY_MS = 300;

/** sendMessage 超时时间（毫秒），超时视为 SW 不可达 */
const MESSAGE_TIMEOUT_MS = 8000;

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
   * 启动翻译：逐批次发送、等待结果、上报进度
   * 检测到扩展上下文失效后立即中止，避免无效等待
   */
  async start(batches: TranslationUnit[][]): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const allResults: TranslatedUnit[] = [];
      let totalUnits = 0;
      for (const batch of batches) totalUnits += batch.length;
      let translatedCount = 0;

      for (let i = 0; i < batches.length; i++) {
        // 每批次开始前检查扩展上下文是否仍有效
        if (!chrome.runtime?.id) {
          console.error('[DocBridge] 扩展上下文已失效，停止翻译队列');
          this.onError?.(new Error('扩展上下文已失效，请刷新页面后重试'));
          break;
        }

        const batch = batches[i];
        try {
          console.log(`[DocBridge] 发送翻译请求，批次 ${i + 1}/${batches.length}`);

          const cached: TranslateResultItem[] = [];
          const uncached: TranslationUnit[] = [];

          for (const unit of batch) {
            const hash = await hashText(unit.originalText);
            const cacheRsp = await this.sendMessage<{ translatedText?: string }>({
              type: 'GET_CACHE',
              payload: { originalHash: hash },
            });
            if (cacheRsp?.translatedText) {
              cached.push({ id: unit.id, translatedText: cacheRsp.translatedText });
            } else {
              uncached.push(unit);
            }
          }

          if (uncached.length > 0) {
            const response = await this.sendMessage<{
              success: boolean;
              data?: TranslateResultItem[];
              error?: string;
            }>({
              type: 'TRANSLATE',
              payload: {
                units: uncached.map((u) => ({
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
              console.warn(`[DocBridge] 批次 ${i + 1}: API 返回 0 条翻译结果`);
            } else {
              console.log(`[DocBridge] 批次 ${i + 1} 收到翻译结果:`, translated.length, '条');
            }
            cached.push(...translated);
          }

          for (const r of cached) {
            const original = batch.find((u) => u.id === r.id);
            if (original) {
              allResults.push({
                id: r.id,
                translatedText: r.translatedText,
                originalUnit: original,
              });
            }
          }

          translatedCount += cached.length;
          this.onProgress(translatedCount, totalUnits);

          if (i < batches.length - 1) {
            await sleep(BATCH_DELAY_MS);
          }
        } catch (err: unknown) {
          const error = err instanceof Error ? err : new Error(String(err));
          // 扩展上下文失效 → 立即中止，不再尝试剩余批次
          if (error.message.includes('Extension context invalidated')
              || error.message.includes('扩展上下文已失效')) {
            console.error(`[DocBridge] 翻译批次 ${i + 1} 失败 (上下文中止):`, error.message);
            this.onError?.(error);
            break;
          }
          console.error(`[DocBridge] 翻译批次 ${i + 1} 失败:`, error.message);
          this.onError?.(error);
          // 其他错误继续下一批次
        }
      }

      this.onComplete(allResults);
    } finally {
      this.isRunning = false;
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
 * 计算文本 SHA-256 哈希（与 background 端保持一致，用于缓存键匹配）
 */
async function hashText(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 延迟工具函数
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
