// src/shared/types.ts — 全局类型定义（核心契约）| DocBridge | 2025-08-06

/** 翻译单元类型 */
export type UnitType =
  | 'heading'
  | 'paragraph'
  | 'list_item'
  | 'table_cell'
  | 'code_block'
  | 'inline_code'
  | 'caption'
  | 'image_text'
  | 'navigation';

/** 显示模式 */
export type DisplayMode = 'bilingual' | 'translated-only' | 'original-only';

/** 翻译单元（扫描阶段产出） */
export interface TranslationUnit {
  id: string;
  type: UnitType;
  element: HTMLElement;
  originalText: string;
  htmlContext: string;
  contextChain: string[];
  isInShadowDOM: boolean;
  isInIframe: boolean;
  priority: number;
}

/** 已翻译单元（翻译阶段产出） */
export interface TranslatedUnit {
  id: string;
  translatedText: string;
  /** 原始单元引用，SW 环境可能为 null（由 content script 端重建） */
  originalUnit: TranslationUnit | null;
}

/** 翻译请求（发送给 Provider 的批量请求） */
export interface TranslationRequest {
  units: Array<{
    id: string;
    text: string;
    contextChain: string[];
  }>;
  glossary: Record<string, string>;
  targetLang: string;
}

/** 翻译提供商接口（所有翻译后端必须实现） */
export interface TranslationProvider {
  readonly name: string;
  readonly maxBatchSize: number;
  readonly supportsContext: boolean;
  translate(request: TranslationRequest): Promise<TranslatedUnit[]>;
}

/** Background 与 Content Script 之间消息协议 */
export interface DTMessage {
  type:
    | 'TRANSLATE'
    | 'TRANSLATE_RESULT'
    | 'GET_CACHE'
    | 'SET_CACHE'
    | 'TOGGLE_DISPLAY'
    | 'START_TRANSLATE';
  payload: unknown;
}

/** 翻译缓存记录（IndexedDB translations 表） */
export interface TranslationCache {
  id: string;
  originalHash: string;
  translatedText: string;
  provider: string;
  timestamp: number;
}

/** 术语表记录（IndexedDB glossary 表） */
export interface GlossaryEntry {
  term: string;
  translation: string;
  domain: string;
}

/** 插件全局配置 */
export interface AppConfig {
  displayMode: DisplayMode;
  apiKey: string;
  targetLang: string;
  glossary: GlossaryEntry[];
  enableAutoTranslate: boolean;
}

/** DeepSeek API 请求体 */
export interface DeepSeekRequest {
  model: string;
  messages: Array<{ role: 'system' | 'user'; content: string }>;
  temperature: number;
  max_tokens: number;
}

/** DeepSeek API 响应体 */
export interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
