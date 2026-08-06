// src/shared/storage/indexeddb.ts — IndexedDB 封装（Dexie.js v4）| DocBridge | 2025-08-06

import Dexie, { type Table } from 'dexie';
import type { TranslationCache, GlossaryEntry } from '../types';
import { DB_NAME, DB_VERSION } from '../constants';

/** DocBridge IndexedDB 数据库 */
class DocBridgeDB extends Dexie {
  /** 翻译缓存表：以 id 为主键 */
  translations!: Table<TranslationCache, string>;

  /** 术语表：以 term 为主键 */
  glossary!: Table<GlossaryEntry, string>;

  constructor() {
    super(DB_NAME);

    this.version(DB_VERSION).stores({
      translations: 'id, originalHash, provider, timestamp',
      glossary: 'term, domain',
    });
  }
}

const db = new DocBridgeDB();

// ---------- Translations 表操作 ----------

/** 获取单条翻译缓存 */
export async function getTranslationCache(
  id: string
): Promise<TranslationCache | undefined> {
  try {
    return await db.translations.get(id);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[DocBridge] 获取翻译缓存失败: ${id}`, message);
    return undefined;
  }
}

/** 按 originalHash 查找翻译缓存 */
export async function getTranslationByHash(
  hash: string
): Promise<TranslationCache | undefined> {
  try {
    return await db.translations.where('originalHash').equals(hash).first();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[DocBridge] 按 hash 查询翻译缓存失败: ${hash}`, message);
    return undefined;
  }
}

/** 保存翻译缓存（存在则更新） */
export async function setTranslationCache(
  record: TranslationCache
): Promise<void> {
  try {
    await db.translations.put(record);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[DocBridge] 保存翻译缓存失败: ${record.id}`, message);
  }
}

/** 批量保存翻译缓存 */
export async function setTranslationCacheBatch(
  records: TranslationCache[]
): Promise<void> {
  try {
    await db.translations.bulkPut(records);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[DocBridge] 批量保存翻译缓存失败', message);
  }
}

/** 删除指定翻译缓存 */
export async function deleteTranslationCache(id: string): Promise<void> {
  try {
    await db.translations.delete(id);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[DocBridge] 删除翻译缓存失败: ${id}`, message);
  }
}

/** 清空所有翻译缓存 */
export async function clearTranslationCache(): Promise<void> {
  try {
    await db.translations.clear();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[DocBridge] 清空翻译缓存失败', message);
  }
}

// ---------- Glossary 表操作 ----------

/** 获取术语翻译 */
export async function getGlossaryTerm(
  term: string
): Promise<GlossaryEntry | undefined> {
  try {
    return await db.glossary.get(term);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[DocBridge] 获取术语失败: ${term}`, message);
    return undefined;
  }
}

/** 保存术语 */
export async function setGlossaryTerm(entry: GlossaryEntry): Promise<void> {
  try {
    await db.glossary.put(entry);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[DocBridge] 保存术语失败: ${entry.term}`, message);
  }
}

/** 批量保存术语 */
export async function setGlossaryTerms(
  entries: GlossaryEntry[]
): Promise<void> {
  try {
    await db.glossary.bulkPut(entries);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[DocBridge] 批量保存术语失败', message);
  }
}

/** 删除术语 */
export async function deleteGlossaryTerm(term: string): Promise<void> {
  try {
    await db.glossary.delete(term);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[DocBridge] 删除术语失败: ${term}`, message);
  }
}

/** 获取所有术语（用于构建术语表字典） */
export async function getAllGlossaryTerms(): Promise<GlossaryEntry[]> {
  try {
    return await db.glossary.toArray();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[DocBridge] 获取所有术语失败', message);
    return [];
  }
}

/** 清空术语表 */
export async function clearGlossary(): Promise<void> {
  try {
    await db.glossary.clear();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[DocBridge] 清空术语表失败', message);
  }
}

export default db;
