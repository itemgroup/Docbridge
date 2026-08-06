// src/content/translator/translation-queue.ts — 翻译调度中心：批量通信、缓存、进度 | DocBridge | 2025-08-06

import type { TranslationUnit, TranslatedUnit, DTMessage } from '../../shared/types';

/** 批次间延迟（毫秒），避免触发限流 */
const BATCH_DELAY_MS = 300;

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

  /** 等待 TRANSLATE_RESULT 的 Promise resolve */
  private pendingResolver: ((results: TranslateResultItem[]) => void) | null = null;

  /** 是否已注册消息监听 */
  private listenerRegistered = false;

  /** 防止 start() 重入 */
  private isRunning = false;

  constructor(callbacks: QueueCallbacks) {
    this.onProgress = callbacks.onProgress;
    this.onComplete = callbacks.onComplete;
    this.onError = callbacks.onError;
    this.registerListener();
  }

  /**
   * 启动翻译：逐批次发送、等待结果、上报进度
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
      const batch = batches[i];
      try {
        // Step 1: 预检查缓存，分离已缓存 vs 待翻译
        const cached: TranslateResultItem[] = [];
        const uncached: TranslationUnit[] = [];

        for (const unit of batch) {
          const hash = await hashText(unit.originalText);
          const cacheRsp = await chrome.runtime.sendMessage({
            type: 'GET_CACHE',
            payload: { originalHash: hash },
          } satisfies DTMessage);
          if (cacheRsp?.translatedText) {
            cached.push({ id: unit.id, translatedText: cacheRsp.translatedText });
          } else {
            uncached.push(unit);
          }
        }

        // Step 2: 发送未缓存单元给 background 翻译
        if (uncached.length > 0) {
          const translatePromise = new Promise<TranslateResultItem[]>((resolve) => {
            this.pendingResolver = resolve;
          });

          await chrome.runtime.sendMessage({
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
          } satisfies DTMessage);

          // 等待 background 发回 TRANSLATE_RESULT
          const translated = await translatePromise;
          cached.push(...translated);
          this.pendingResolver = null;
        }

        // Step 3: 构建 TranslatedUnit 对象
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

        // Step 4: 批次间延迟
        if (i < batches.length - 1) {
          await sleep(BATCH_DELAY_MS);
        }
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error(`[DocBridge] 翻译批次 ${i} 失败:`, error.message);
        this.onError?.(error);
      }
    }

    this.onComplete(allResults);
    } finally {
    this.isRunning = false;
    }
  }

  /** 销毁队列，移除监听 */
  destroy(): void {
    if (this.listenerRegistered) {
      chrome.runtime.onMessage.removeListener(this.handleMessage);
      this.listenerRegistered = false;
    }
  }

  /**
   * 注册 chrome.runtime.onMessage 监听，接收 background 发来的 TRANSLATE_RESULT
   */
  private registerListener(): void {
    if (this.listenerRegistered) return;
    chrome.runtime.onMessage.addListener(this.handleMessage);
    this.listenerRegistered = true;
  }

  /**
   * 消息处理器（使用箭头函数保持 this 绑定）
   */
  private handleMessage = (
    message: DTMessage
  ): void => {
    if (message.type === 'TRANSLATE_RESULT' && this.pendingResolver) {
      const { results } = message.payload as { results: TranslateResultItem[] };
      this.pendingResolver(results);
    }
  };
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
