// src/background/index.ts — Service Worker：消息路由、缓存管理 | DocBridge | 2025-08-06

import type { DTMessage, DisplayMode, TranslationRequest } from '../shared/types';
import { DeepSeekProvider } from './provider/deepseek';

/** chrome.storage.local 缓存键前缀 */
const CACHE_PREFIX = 'docbridge:cache:';

/** 缓存有效期（7 天，毫秒） */
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** 缓存值结构 */
interface CacheEntry {
  translatedText: string;
  timestamp: number;
}

/** DeepSeek 提供商（API Key 从 storage 读取后初始化） */
let translateProvider: DeepSeekProvider | null = null;

// ---------- 启动时初始化 ----------

(async function init() {
  // 从 storage 读取 API Key 初始化 Provider（与 options 页面共享同一键 docbridge:options）
  const result = await chrome.storage.local.get('docbridge:options');
  const options = result['docbridge:options'];
  const apiKey: string | undefined = options?.apiKey;
  if (apiKey) {
    translateProvider = new DeepSeekProvider(apiKey);
  }

  // 监听 storage 变更，API Key 更新后同步 Provider
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    const optionsChange = changes['docbridge:options'];
    if (optionsChange?.newValue?.apiKey !== undefined) {
      const newKey: string = optionsChange.newValue.apiKey;
      if (newKey) {
        if (translateProvider) {
          translateProvider.setApiKey(newKey);
        } else {
          translateProvider = new DeepSeekProvider(newKey);
        }
      } else {
        // API Key 被清空，销毁 Provider 防止残留旧密钥
        translateProvider = null;
      }
    }
  });

  // 清理过期缓存
  clearExpiredCache().catch((err: unknown) => {
    console.error('[DocBridge] 清理过期缓存失败:', err);
  });
})();

/**
 * 从 chrome.storage.local 读取缓存，自动清理过期条目
 */
async function getCache(originalHash: string): Promise<string | null> {
  const key = CACHE_PREFIX + originalHash;
  const result = await chrome.storage.local.get(key);
  const entry: CacheEntry | undefined = result[key];
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    await chrome.storage.local.remove(key);
    return null;
  }
  return entry.translatedText;
}

/**
 * 将翻译结果写入 chrome.storage.local
 */
async function setCache(
  originalHash: string,
  translatedText: string
): Promise<void> {
  const key = CACHE_PREFIX + originalHash;
  const entry: CacheEntry = { translatedText, timestamp: Date.now() };
  await chrome.storage.local.set({ [key]: entry });
}

/**
 * 清理所有过期的缓存条目
 */
async function clearExpiredCache(): Promise<void> {
  const all = await chrome.storage.local.get(null);
  const expiredKeys: string[] = [];
  const now = Date.now();
  for (const [key, value] of Object.entries(all)) {
    if (!key.startsWith(CACHE_PREFIX)) continue;
    const entry = value as CacheEntry;
    if (now - entry.timestamp > CACHE_TTL_MS) {
      expiredKeys.push(key);
    }
  }
  if (expiredKeys.length > 0) {
    await chrome.storage.local.remove(expiredKeys);
  }
}

// ---------- 消息路由 ----------

chrome.runtime.onMessage.addListener(
  (message: DTMessage, sender, sendResponse) => {
    handleMessage(message, sender)
      .then((result) => sendResponse(result))
      .catch((err: unknown) => {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error('[DocBridge] 消息处理失败:', errorMsg);
        sendResponse({ error: errorMsg });
      });
    return true;
  }
);

/**
 * 根据消息类型分发处理
 */
async function handleMessage(
  message: DTMessage,
  sender: chrome.runtime.MessageSender
): Promise<Record<string, unknown>> {
  switch (message.type) {
    case 'GET_CACHE': {
      const { originalHash } = message.payload as { originalHash: string };
      const translated = await getCache(originalHash);
      return { translatedText: translated };
    }

    case 'SET_CACHE': {
      const { originalHash, translatedText } = message.payload as {
        originalHash: string;
        translatedText: string;
      };
      await setCache(originalHash, translatedText);
      return { success: true };
    }

    case 'TRANSLATE': {
      const { units, glossary, targetLang } = message.payload as {
        units: TranslationRequest['units'];
        glossary: Record<string, string>;
        targetLang: string;
      };

      // 先查缓存，未命中才请求 API
      const cached: Array<{ id: string; translatedText: string }> = [];
      const uncached: TranslationRequest['units'] = [];

      for (const unit of units) {
        const hash = await simpleHash(unit.text);
        const cachedText = await getCache(hash);
        if (cachedText) {
          cached.push({ id: unit.id, translatedText: cachedText });
        } else {
          uncached.push(unit);
        }
      }

      // 未命中部分调用 DeepSeek
      if (uncached.length > 0 && translateProvider) {
        const request: TranslationRequest = {
          units: uncached,
          glossary,
          targetLang,
        };
        const translated = await translateProvider.translate(request);
        // 写入缓存
        for (const t of translated) {
          const original = uncached.find((u) => u.id === t.id);
          if (original) {
            const hash = await simpleHash(original.text);
            await setCache(hash, t.translatedText);
          }
          cached.push({ id: t.id, translatedText: t.translatedText });
        }
      }

      // 将结果发回请求的 tab
      if (sender.tab?.id != null) {
        await chrome.tabs.sendMessage(sender.tab.id, {
          type: 'TRANSLATE_RESULT',
          payload: { results: cached },
        } satisfies DTMessage);
      }
      return { success: true, cached: cached.length, total: units.length };
    }

    case 'TOGGLE_DISPLAY': {
      const { mode } = message.payload as { mode: DisplayMode };
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (tab.id == null) continue;
        try {
          await chrome.tabs.sendMessage(tab.id, {
            type: 'TOGGLE_DISPLAY',
            payload: { mode },
          } satisfies DTMessage);
        } catch {
          // 某些 tab 可能没有注入 content script，忽略
        }
      }
      return { success: true, mode };
    }

    default:
      return { error: `未知消息类型: ${(message as DTMessage).type}` };
  }
}

/**
 * 简单哈希函数（用于缓存键）
 */
async function simpleHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
