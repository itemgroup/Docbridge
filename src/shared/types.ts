// DocBridge 全局类型定义 | 核心契约
// 所有模块的类型都必须在此定义，严禁使用 any

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

/** 行内元素占位引用（语义标签：a/sup/sub 整体占位，不拆分内部文本） */
export interface InlineElementRef {
  /** 占位符，如 {{TAG_0}} */
  placeholder: string;
  /** 原始 DOM 元素引用（渲染时深克隆，保留全部属性与子节点） */
  element: HTMLElement;
  /** 原始显示文本（仅用于参考，不发送给 LLM） */
  originalText: string;
}

/** 翻译单元 - 扫描器输出 */
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
  /** 行内语义元素引用（占位符方案），如 a/sup/sub */
  inlineRefs?: InlineElementRef[];
}

/** 已翻译单元 */
export interface TranslatedUnit {
  id: string;
  translatedText: string;
  originalUnit: TranslationUnit;
}

/** 翻译请求 */
export interface TranslationRequest {
  units: Array<{
    id: string;
    text: string;
    contextChain: string[];
  }>;
  glossary: Record<string, string>;
  targetLang: string;
}

/** 翻译提供商接口 */
export interface TranslationProvider {
  readonly name: string;
  readonly maxBatchSize: number;
  readonly supportsContext: boolean;
  translate(request: TranslationRequest): Promise<TranslatedUnit[]>;
}

/** DeepSeek API 请求体 */
export interface DeepSeekRequest {
  model: string;
  messages: Array<{ role: 'system' | 'user'; content: string }>;
  temperature: number;
  max_tokens: number;
}

/** DeepSeek API 响应 */
export interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
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

/** 后台与 Content Script 通信消息 */
export interface DTMessage {
  type: 'TRANSLATE' | 'TRANSLATE_RESULT' | 'GET_CACHE' | 'SET_CACHE' | 'TOGGLE_DISPLAY' | 'START_TRANSLATE' | 'EXPORT_HTML' | 'STOP_TRANSLATE' | 'CLEAR_TRANSLATION';
  payload: unknown;
}

/** 翻译结果消息 */
export interface DTTranslateResult {
  units: TranslatedUnit[];
  success: boolean;
  error?: string;
}

/** 缓存条目 */
export interface CacheEntry {
  id?: number;
  originalHash: string;
  translatedText: string;
  provider: string;
  timestamp: number;
}

/** 术语表条目 */
export interface GlossaryEntry {
  id?: number;
  term: string;
  translation: string;
  domain: string;
}

/** 用户配置 */
export interface UserConfig {
  apiKey: string;
  apiBaseURL: string;
  glossary: GlossaryEntry[];
  displayMode: DisplayMode;
  whitelist: string[];
  blacklist: string[];
}
