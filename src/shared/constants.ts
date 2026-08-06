// src/shared/constants.ts — 全局常量 | DocBridge | 2025-08-06

import type { DisplayMode } from './types';

/** 插件名称 */
export const EXTENSION_NAME = 'DocBridge';

/** 插件版本 */
export const EXTENSION_VERSION = '1.0.0';

/** 默认显示模式 */
export const DEFAULT_DISPLAY_MODE: DisplayMode = 'bilingual';

/** 默认目标语言 */
export const DEFAULT_TARGET_LANG = 'zh-CN';

/** DeepSeek API 默认配置 */
export const DEEPSEEK_API_CONFIG = {
  baseURL: 'https://api.deepseek.com/v1',
  model: 'deepseek-chat',
  temperature: 0.3,
  max_tokens: 4096,
  timeout: 10000,
} as const;

/** 网络请求最大重试次数 */
export const MAX_RETRIES = 3;

/** 指数退避基础延迟（毫秒） */
export const RETRY_BASE_DELAY_MS = 1000;

/** 翻译队列防抖延迟（毫秒）——连续滚动时等待 */
export const DEBOUNCE_DELAY_MS = 300;

/** 翻译批次最大单元数 */
export const MAX_BATCH_SIZE = 20;

// ---------- DOM 选择器常量 ----------

/** 需要排除的非内容区域选择器（nav、footer、ad 等） */
export const EXCLUDE_SELECTORS = [
  'nav',
  'footer',
  'header[role="banner"]',
  '[role="navigation"]',
  '[role="complementary"]',
  '[class*="nav"]',
  '[class*="footer"]',
  '[class*="sidebar"]',
  '[class*="comment"]',
  '[class*="ad-"]',
  '[class*="advertisement"]',
  '[id*="nav"]',
  '[id*="footer"]',
  '[id*="sidebar"]',
  '[id*="comment"]',
  '[id*="ad-"]',
  '[id*="advertisement"]',
  '.nav',
  '.footer',
  '.sidebar',
  '.comment',
  '.advertisement',
  'script',
  'style',
  'noscript',
  'iframe',
  'svg',
  'input',
  'textarea',
  'select',
  'button',
];

/** 主内容候选选择器（按优先级排列） */
export const MAIN_CONTENT_SELECTORS = [
  'main',
  'article',
  '[role="main"]',
  '.post-content',
  '.article-content',
  '.entry-content',
  '.content',
  '#content',
  '.markdown-body',
  '.doc-content',
  '#main-content',
  '.main-content',
];

/** 译文容器 CSS class 名 */
export const DT_BRIDGE_CLASS = 'dt-bridge';

/** 译文节点 CSS class 名 */
export const DT_WRAPPER_CLASS = 'dt-bridge-wrapper';

/** 译文标签 CSS class 名 */
export const DT_LABEL_CLASS = 'dt-label';

/** 译文文本 CSS class 名 */
export const DT_TEXT_CLASS = 'dt-text';

/** data 属性名——绑定翻译单元 ID */
export const DT_ID_ATTR = 'data-dt-id';

/** 存储键名 */
export const STORAGE_KEYS = {
  DISPLAY_MODE: 'docbridge:display_mode',
  API_KEY: 'docbridge:api_key',
  TARGET_LANG: 'docbridge:target_lang',
  GLOSSARY: 'docbridge:glossary',
  AUTO_TRANSLATE: 'docbridge:auto_translate',
} as const;

/** IndexedDB 数据库名 */
export const DB_NAME = 'docbridge';

/** IndexedDB 版本 */
export const DB_VERSION = 1;
