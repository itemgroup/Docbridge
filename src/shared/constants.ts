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
export const MAX_CONCURRENT_REQUESTS = 5;

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

/** 翻译专用系统提示词 */
export const TRANSLATION_SYSTEM_PROMPT = `你是专业技术文档翻译专家，将英文技术文档译为简体中文。
规则：
1. 信达雅，忠实原文；
2. 保留术语：React/Vue/API/DOM/CSS/HTML/HTTP/URL/GitHub/JSON/TypeScript/JavaScript/Python/Docker/Kubernetes/Linux/Git/CLI/SDK/UI/UX/SQL/NoSQL/REST/GraphQL/WebSocket/OAuth/JWT/CI/CD/Hooks/middleware/debounce/throttle；
3. 代码、变量、URL、命令行保持原样；
4. 只翻译自然语言和注释；
5. 【强制】{{TAG_0}} {{TAG_1}} 等 {{TAG_N}} 占位符代表超链接或行内元素，必须严格原样保留，不得修改、删除或翻译占位符的任何字符。
输出格式：UNIT_ID|||译文内容`;

/** 默认显示模式 */
export const DEFAULT_DISPLAY_MODE: import('./types').DisplayMode = 'bilingual';

/** 弹窗宽度 */
export const POPUP_WIDTH = 280;
