// IndexedDB 封装层 | DocBridge 本地缓存
// 使用 Dexie.js v4 管理翻译缓存和术语表

import Dexie, { type Table } from 'dexie';
import type { CacheEntry, GlossaryEntry } from '../types';
import { CACHE_TTL_MS } from '../constants';

/** DocBridge 数据库类 */
class DocBridgeDB extends Dexie {
  translations!: Table<CacheEntry, number>;
  glossary!: Table<GlossaryEntry, number>;

  constructor() {
    super('DocBridgeDB');
    this.version(1).stores({
      translations: '++id, originalHash, provider, timestamp',
      glossary: '++id, term, domain',
    });
  }
}

const db = new DocBridgeDB();

/** 缓存管理工具类 */
export class CacheManager {
  /**
   * 根据原文哈希查询缓存
   * @param originalHash - 原文 SHA 哈希
   * @returns 缓存条目或 null
   */
  static async getCache(originalHash: string): Promise<CacheEntry | null> {
    try {
      const entry = await db.translations
        .where('originalHash')
        .equals(originalHash)
        .first();

      if (!entry) return null;

      // 检查是否过期
      if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
        await db.translations.delete(entry.id!);
        return null;
      }

      return entry;
    } catch (error) {
      console.error('[DocBridge Cache] 查询缓存失败:', error);
      return null;
    }
  }

  /**
   * 批量查询缓存
   * @param hashes - 原文哈希数组
   * @returns 缓存条目数组
   */
  static async getCacheBatch(hashes: string[]): Promise<Map<string, CacheEntry>> {
    try {
      const entries = await db.translations
        .where('originalHash')
        .anyOf(hashes)
        .toArray();

      const result = new Map<string, CacheEntry>();
      const now = Date.now();

      for (const entry of entries) {
        if (now - entry.timestamp <= CACHE_TTL_MS) {
          result.set(entry.originalHash, entry);
        } else {
          // 异步清理过期条目
          db.translations.delete(entry.id!).catch(() => {});
        }
      }

      return result;
    } catch (error) {
      console.error('[DocBridge Cache] 批量查询缓存失败:', error);
      return new Map();
    }
  }

  /**
   * 写入翻译缓存
   * @param originalHash - 原文哈希
   * @param translatedText - 译文
   * @param provider - 翻译提供商
   */
  static async setCache(
    originalHash: string,
    translatedText: string,
    provider: string
  ): Promise<void> {
    try {
      // 如果已存在则更新
      const existing = await db.translations
        .where('originalHash')
        .equals(originalHash)
        .first();

      if (existing) {
        await db.translations.update(existing.id!, {
          translatedText,
          provider,
          timestamp: Date.now(),
        });
      } else {
        await db.translations.add({
          originalHash,
          translatedText,
          provider,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      console.error('[DocBridge Cache] 写入缓存失败:', error);
    }
  }

  /**
   * 批量写入缓存
   * @param entries - 缓存条目数组
   */
  static async setCacheBatch(
    entries: Array<{ originalHash: string; translatedText: string; provider: string }>
  ): Promise<void> {
    try {
      await db.transaction('rw', db.translations, async () => {
        for (const entry of entries) {
          const existing = await db.translations
            .where('originalHash')
            .equals(entry.originalHash)
            .first();

          if (existing) {
            await db.translations.update(existing.id!, {
              translatedText: entry.translatedText,
              provider: entry.provider,
              timestamp: Date.now(),
            });
          } else {
            await db.translations.add({
              originalHash: entry.originalHash,
              translatedText: entry.translatedText,
              provider: entry.provider,
              timestamp: Date.now(),
            });
          }
        }
      });
    } catch (error) {
      console.error('[DocBridge Cache] 批量写入缓存失败:', error);
    }
  }

  /**
   * 清理过期缓存
   * @returns 删除的条目数
   */
  static async cleanExpiredCache(): Promise<number> {
    try {
      const cutoff = Date.now() - CACHE_TTL_MS;
      const expired = await db.translations
        .where('timestamp')
        .below(cutoff)
        .toArray();

      if (expired.length > 0) {
        await db.translations.bulkDelete(expired.map((e) => e.id!));
      }

      return expired.length;
    } catch (error) {
      console.error('[DocBridge Cache] 清理过期缓存失败:', error);
      return 0;
    }
  }

  /** 获取缓存统计 */
  static async getStats(): Promise<{ total: number; size: number }> {
    try {
      const total = await db.translations.count();
      return { total, size: 0 };
    } catch {
      return { total: 0, size: 0 };
    }
  }
}

/** 术语表管理工具类 */
export class GlossaryManager {
  /**
   * 获取所有术语
   * @returns 术语数组
   */
  static async getAllGlossary(): Promise<GlossaryEntry[]> {
    try {
      return await db.glossary.toArray();
    } catch (error) {
      console.error('[DocBridge Glossary] 获取术语失败:', error);
      return [];
    }
  }

  /**
   * 添加术语
   * @param term - 英文术语
   * @param translation - 中文翻译
   * @param domain - 领域
   */
  static async addTerm(term: string, translation: string, domain: string): Promise<void> {
    try {
      const existing = await db.glossary.where('term').equals(term).first();
      if (existing) {
        await db.glossary.update(existing.id!, { translation, domain });
      } else {
        await db.glossary.add({ term, translation, domain });
      }
    } catch (error) {
      console.error('[DocBridge Glossary] 添加术语失败:', error);
    }
  }

  /**
   * 删除术语
   * @param term - 英文术语
   */
  static async removeTerm(term: string): Promise<void> {
    try {
      await db.glossary.where('term').equals(term).delete();
    } catch (error) {
      console.error('[DocBridge Glossary] 删除术语失败:', error);
    }
  }

  /**
   * 获取术语表字典
   * @returns Record 格式术语表
   */
  static async getGlossaryDict(): Promise<Record<string, string>> {
    try {
      const entries = await db.glossary.toArray();
      const dict: Record<string, string> = {};
      for (const entry of entries) {
        dict[entry.term] = entry.translation;
      }
      return dict;
    } catch (error) {
      console.error('[DocBridge Glossary] 获取术语字典失败:', error);
      return {};
    }
  }
}
