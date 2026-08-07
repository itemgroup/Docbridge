// DocBridge 全局常量定义

/** 插件名称 */
export const APP_NAME = 'DocBridge';

/** 插件版本 */
export const APP_VERSION = '1.0.0';

/** DeepSeek API 默认基础地址 */
export const DEFAULT_API_BASE_URL = 'https://api.deepseek.com/v1';

/** DeepSeek 默认模型 */
export const DEFAULT_MODEL = 'deepseek-chat';

/** 翻译温度参数 */
export const TRANSLATION_TEMPERATURE = 0.3;

/** 最大输出 token */
export const MAX_TOKENS = 4096;

/** 单批次最大翻译单元数 */
export const MAX_BATCH_SIZE = 50;

/** 最大并发请求数 */
export const MAX_CONCURRENT_REQUESTS = 3;

/** 批次发送间隔（毫秒） */
export const BATCH_INTERVAL_MS = 20;

/** 网络请求超时（毫秒） */
export const REQUEST_TIMEOUT_MS = 10000;

/** 最大重试次数 */
export const MAX_RETRIES = 3;

/** 指数退避基础延迟（毫秒） */
export const RETRY_BASE_DELAY_MS = 1000;

/** 缓存过期时间（毫秒），默认 7 天 */
export const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** SPA DOM 变化防抖延迟（毫秒） */
export const DOM_DEBOUNCE_MS = 350;

/** 翻译结果格式分隔符 */
export const TRANSLATION_SEPARATOR = '|||';

/** 需要排除的 DOM 选择器 */
export const EXCLUDE_SELECTORS = [
  'nav', 'header', 'footer', 'aside',
  'script', 'style', 'noscript', 'iframe',
  '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
  '.nav', '.navbar', '.navigation', '.header', '.footer', '.sidebar',
  '.advertisement', '.ad', '.ads', '.banner-ad',
  '[class*="ad-"]', '[class*="ads-"]', '[id*="ad-"]',
  '.cookie-banner', '.cookie-consent', '.popup', '.modal',
  '.comment', '.comments', '#comments',
];

/** 代码块选择器（只翻译注释，保留代码） */
export const CODE_SELECTORS = [
  'pre', 'code',
];

/** 块级文本容器选择器（叶子节点的父级，需要跳过直接扫描） */
export const BLOCK_CONTAINER_SELECTORS = [
  'p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'td', 'th', 'dt', 'dd', 'figcaption', 'caption',
  'blockquote', 'summary', 'label', 'legend',
];

/** 翻译专用系统提示词（精简版，减少 token 开销） */
export const TRANSLATION_SYSTEM_PROMPT = `技术文档英译中。规则：1.信达雅；2.保留原样：代码/变量/URL/命令/React/Vue/API/DOM,CSS,HTML,HTTP,JSON,TS,JS,Python,Docker,CI/CD等术语；3.只译自然语言与注释；4.【强制】{{TAG_N}}占位符(链接或代码)原样保留不译。输出：UNIT_ID|||译文`;

/** 默认显示模式 */
export const DEFAULT_DISPLAY_MODE: import('./types').DisplayMode = 'bilingual';

/** 弹窗宽度 */
export const POPUP_WIDTH = 280;
