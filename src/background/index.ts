// Service Worker 入口 | DocBridge 后台消息路由
import type { DTMessage, DTTranslateResult } from '../shared/types';
import { deepseekProvider } from './provider/deepseek';
import { CacheManager } from '../shared/storage/indexeddb';
import { TranslationRequest } from '../shared/types';

/**
 * 消息监听器 - 所有 content script 请求的入口
 * 必须返回 true 保持消息通道开启
 */
chrome.runtime.onMessage.addListener(
  (message: DTMessage, _sender, sendResponse) => {
    const { type, payload } = message;

    // TRANSLATE: 执行翻译请求
    if (type === 'TRANSLATE') {
      handleTranslate(payload as TranslationRequest)
        .then((result) => sendResponse(result))
        .catch((err) => sendResponse({ success: false, error: err instanceof Error ? err.message : String(err) }));
      return true;
    }

    // GET_CACHE: 查询缓存
    if (type === 'GET_CACHE') {
      handleGetCache(payload as string)
        .then((result) => sendResponse(result))
        .catch(() => sendResponse(null));
      return true;
    }

    // SET_CACHE: 写入缓存
    if (type === 'SET_CACHE') {
      handleSetCache(payload as { originalHash: string; translatedText: string })
        .then(() => sendResponse({ success: true }))
        .catch((err) => sendResponse({ success: false, error: err instanceof Error ? err.message : String(err) }));
      return true;
    }

    return false;
  }
);

/**
 * 处理翻译请求
 */
async function handleTranslate(payload: TranslationRequest): Promise<DTTranslateResult> {
  try {
    const units = await deepseekProvider.translate(payload);
    return { units, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { units: [], success: false, error: message };
  }
}

/**
 * 处理缓存查询
 */
async function handleGetCache(payload: string): Promise<Record<string, unknown> | null> {
  try {
    const cached = await CacheManager.getCache(payload);
    return cached ? { ...cached } : null;
  } catch {
    return null;
  }
}

/**
 * 处理缓存写入
 */
async function handleSetCache(payload: {
  originalHash: string;
  translatedText: string;
}): Promise<void> {
  await CacheManager.setCache(payload.originalHash, payload.translatedText, 'deepseek');
}

// Service Worker 安装时清理过期缓存
chrome.runtime.onInstalled.addListener(() => {
  console.log('[DocBridge] Service Worker 已安装');
  CacheManager.cleanExpiredCache().then((count) => {
    if (count > 0) {
      console.log(`[DocBridge] 清理了 ${count} 条过期缓存`);
    }
  });
});

console.log('[DocBridge] Background Service Worker 已启动');
