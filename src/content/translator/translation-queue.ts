// 翻译调度队列 | 滑动窗口并发控制
import type { TranslationUnit, TranslatedUnit } from '../../shared/types';
import type { DTMessage } from '../../shared/types';
import { MAX_CONCURRENT_REQUESTS, BATCH_INTERVAL_MS } from '../../shared/constants';
import { extractRequestData } from '../analyzer/unit-builder';
import { GlossaryManager } from '../../shared/storage/indexeddb';

/** 进度回调类型 */
export type ProgressCallback = (completed: number, total: number) => void;

/** 完成回调类型 */
export type CompleteCallback = (results: TranslatedUnit[]) => void;

/** 错误回调类型 */
export type ErrorCallback = (error: string, failedIds: string[]) => void;

/**
 * 调度队列状态
 */
interface QueueState {
  batches: TranslationUnit[][];
  results: TranslatedUnit[];
  completed: number;
  total: number;
  activeCount: number;
  isRunning: boolean;
  progressCb: ProgressCallback | null;
  completeCb: CompleteCallback | null;
  errorCb: ErrorCallback | null;
}

/**
 * 翻译调度队列
 */
export class TranslationQueue {
  private state: QueueState = {
    batches: [],
    results: [],
    completed: 0,
    total: 0,
    activeCount: 0,
    isRunning: false,
    progressCb: null,
    completeCb: null,
    errorCb: null,
  };

  /**
   * 开始翻译流程
   */
  async start(
    batches: TranslationUnit[][],
    progressCb?: ProgressCallback,
    completeCb?: CompleteCallback,
    errorCb?: ErrorCallback
  ): Promise<void> {
    if (this.state.isRunning) {
      console.warn('[DocBridge Queue] 翻译队列已在运行中');
      return;
    }

    // 计算总数
    const total = batches.reduce((sum, b) => sum + b.length, 0);

    this.state = {
      batches: [...batches],
      results: [],
      completed: 0,
      total,
      activeCount: 0,
      isRunning: true,
      progressCb: progressCb || null,
      completeCb: completeCb || null,
      errorCb: errorCb || null,
    };

    console.log(`[DocBridge Queue] 开始翻译，共 ${batches.length} 批次，${total} 个单元`);

    // 使用滑动窗口控制并发
    await this.processWithSlidingWindow();
  }

  /**
   * 滑动窗口并发处理
   */
  private async processWithSlidingWindow(): Promise<void> {
    const { batches } = this.state;
    let batchIndex = 0;

    // 启动初始窗口内的批次
    const initialCount = Math.min(MAX_CONCURRENT_REQUESTS, batches.length);
    for (let i = 0; i < initialCount; i++) {
      batchIndex = i;
      this.processBatch(batches[i], batchIndex);
    }

    // 滑动窗口：每完成一个批次，启动下一个
    while (batchIndex < batches.length - 1) {
      await this.waitForSlot();
      batchIndex++;
      if (batchIndex < batches.length) {
        this.processBatch(batches[batchIndex], batchIndex);
      }
    }

    // 等待所有活跃批次完成
    await this.waitForAllComplete();

    // 触发完成回调
    if (this.state.completeCb) {
      this.state.completeCb(this.state.results);
    }

    this.state.isRunning = false;
  }

  /**
   * 处理单个批次
   */
  private processBatch(batch: TranslationUnit[], batchId: number): void {
    this.state.activeCount++;

    // 延迟发送（批次间隔）
    const delay = batchId * BATCH_INTERVAL_MS;
    setTimeout(() => {
      this.sendBatch(batch);
    }, delay);
  }

  /**
   * 发送批次翻译请求
   */
  private sendBatch(batch: TranslationUnit[]): void {
    if (!this.state.isRunning) {
      this.state.activeCount--;
      return;
    }

    // 从 batch 中提取请求数据
    const requestData = extractRequestData(batch);

    // 获取术语表
    GlossaryManager.getGlossaryDict().then((glossary) => {
      const message: DTMessage = {
        type: 'TRANSLATE',
        payload: {
          units: requestData,
          glossary,
          targetLang: 'zh-CN',
        },
      };

      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          console.error('[DocBridge Queue] 消息发送失败:', chrome.runtime.lastError.message);
          this.handleBatchError(
            batch.map((u) => u.id),
            chrome.runtime.lastError.message || '消息发送失败'
          );
          return;
        }

        if (!response || !response.success) {
          const errorMsg = response?.error || '翻译请求失败';
          console.error('[DocBridge Queue] 批次翻译失败:', errorMsg);
          this.handleBatchError(
            batch.map((u) => u.id),
            errorMsg
          );
          return;
        }

        // 合并结果
        const translatedUnits: TranslatedUnit[] = response.units;
        for (const tu of translatedUnits) {
          // 关联原始 TranslationUnit
          const originalUnit = batch.find((u) => u.id === tu.id);
          if (originalUnit && tu.translatedText !== originalUnit.originalText) {
            tu.originalUnit = originalUnit;
          }
        }

        this.state.results.push(...translatedUnits);
        this.state.completed += batch.length;
        this.state.activeCount--;

        // 触发进度回调
        if (this.state.progressCb) {
          this.state.progressCb(this.state.completed, this.state.total);
        }

        console.log(
          `[DocBridge Queue] 批次完成 (${this.state.completed}/${this.state.total})`
        );
      });
    });
  }

  /**
   * 处理批次错误
   */
  private handleBatchError(failedIds: string[], error: string): void {
    this.state.completed += failedIds.length;
    this.state.activeCount--;

    if (this.state.errorCb) {
      this.state.errorCb(error, failedIds);
    }

    if (this.state.progressCb) {
      this.state.progressCb(this.state.completed, this.state.total);
    }
  }

  /**
   * 等待一个并发槽位
   */
  private waitForSlot(): Promise<void> {
    return new Promise((resolve) => {
      const check = () => {
        if (this.state.activeCount < MAX_CONCURRENT_REQUESTS) {
          resolve();
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });
  }

  /**
   * 等待所有活跃批次完成
   */
  private waitForAllComplete(): Promise<void> {
    return new Promise((resolve) => {
      const check = () => {
        if (this.state.activeCount <= 0) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  /**
   * 停止翻译
   */
  stop(): void {
    this.state.isRunning = false;
    console.log('[DocBridge Queue] 翻译已停止');
  }
}
