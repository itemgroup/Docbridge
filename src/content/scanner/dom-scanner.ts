// DOM 扫描器 | 识别页面主内容区域的文本节点
import type { TranslationUnit, UnitType } from '../../shared/types';
import { EXCLUDE_SELECTORS, CODE_SELECTORS, BLOCK_CONTAINER_SELECTORS } from '../../shared/constants';

/** 扫描配置 */
export interface ScannerConfig {
  /** 是否扫描 Shadow DOM */
  includeShadowDOM: boolean;
  /** 是否扫描 iframe */
  includeIframes: boolean;
  /** 最小文本长度 */
  minTextLength: number;
  /** 视口内优先级加成 */
  viewportPriorityBonus: number;
}

const DEFAULT_CONFIG: ScannerConfig = {
  includeShadowDOM: false,
  includeIframes: false,
  minTextLength: 3,
  viewportPriorityBonus: 100,
};

/** 全局计数器，生成唯一 ID */
let idCounter = 0;

/**
 * 扫描页面，提取所有需要翻译的文本单元
 * @param root - 扫描根元素
 * @param config - 可选配置
 * @returns TranslationUnit 数组
 */
export async function scanPage(
  root: HTMLElement = document.body,
  config: Partial<ScannerConfig> = {}
): Promise<TranslationUnit[]> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const units: TranslationUnit[] = [];

  scanElement(root, null, [], false, false, cfg, units);
  return units;
}

/**
 * 递归扫描单个元素
 * - 跳过排除选择器匹配的元素
 * - 跳过已翻译标记的元素
 * - 跳过代码块
 * - 深度优先扫描，优先返回叶子文本节点
 */
function scanElement(
  element: HTMLElement,
  parentSection: string | null,
  contextChain: string[],
  isInShadowDOM: boolean,
  isInIframe: boolean,
  config: ScannerConfig,
  result: TranslationUnit[]
): void {
  // 检查是否应排除
  if (shouldExclude(element)) return;

  // 检查是否已翻译
  if (element.hasAttribute('data-dt-translated')) return;

  // 检查是否为代码块（跳过）
  if (isCodeBlock(element)) return;

  // 更新上下文链
  const heading = getHeadingText(element);
  const newContextChain = heading
    ? [...contextChain, heading]
    : [...contextChain];

  const section = heading || parentSection;

  // 检查是否为叶子文本容器（p, li, h1-h6, td 等）
  if (isLeafTextContainer(element)) {
    const unit = createUnit(element, section, newContextChain, isInShadowDOM, isInIframe, config);
    if (unit) result.push(unit);
    return;
  }

  // 递归扫描子元素
  const children = element.children;
  for (let i = 0; i < children.length; i++) {
    const child = children[i] as HTMLElement;
    scanElement(child, section, newContextChain, isInShadowDOM, isInIframe, config, result);
  }
}

/**
 * 判断元素是否应被排除
 */
function shouldExclude(element: HTMLElement): boolean {
  const tagName = element.tagName.toLowerCase();

  // 检查标签名
  for (const selector of EXCLUDE_SELECTORS) {
    if (selector.startsWith('.') || selector.startsWith('#') || selector.startsWith('[')) {
      // CSS 类/ID 选择器
      if (element.matches(selector)) return true;
    } else if (selector === tagName) {
      return true;
    }
  }

  // 检查 data-dt-translated 或 dt-exclude 属性
  if (element.hasAttribute('data-dt-exclude')) return true;

  return false;
}

/**
 * 判断元素是否为代码块
 */
function isCodeBlock(element: HTMLElement): boolean {
  const tagName = element.tagName.toLowerCase();
  return CODE_SELECTORS.includes(tagName);
}

/**
 * 判断元素是否为叶子文本容器
 * 只有当元素是 p/li/h1-h6/td 等块级文本元素时才返回 true
 * 如果元素内部仍有 p/li/h1-h6 等子文本容器，应跳过父级，只扫描子级
 */
function isLeafTextContainer(element: HTMLElement): boolean {
  const tagName = element.tagName.toLowerCase();

  // 检查自身是否为块级容器
  if (!BLOCK_CONTAINER_SELECTORS.includes(tagName)) return false;

  // 如果内部还有块级容器子元素，不算叶子，应递归
  for (const childSelector of BLOCK_CONTAINER_SELECTORS) {
    if (element.querySelector(childSelector)) return false;
  }

  const text = getDirectText(element).trim();
  return text.length > 0;
}

/**
 * 获取元素的直接纯文本（不含子元素标签）
 */
function getDirectText(element: HTMLElement): string {
  let text = '';
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent || '';
    }
  }
  return text;
}

/**
 * 获取元素完整 innerText（用于翻译）
 */
function getFullText(element: HTMLElement): string {
  return element.innerText || element.textContent || '';
}

/**
 * 尝试获取父级标题文本
 */
function getHeadingText(element: HTMLElement): string | null {
  const tagName = element.tagName.toLowerCase();
  if (/^h[1-6]$/.test(tagName)) {
    return element.textContent?.trim() || null;
  }
  return null;
}

/**
 * 判断元素是否在视口内
 */
function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top < window.innerHeight &&
    rect.bottom > 0 &&
    rect.left < window.innerWidth &&
    rect.right > 0
  );
}

/**
 * 判断文本类型
 */
function determineUnitType(element: HTMLElement): UnitType {
  const tagName = element.tagName.toLowerCase();

  if (/^h[1-6]$/.test(tagName)) return 'heading';
  if (tagName === 'p') return 'paragraph';
  if (tagName === 'li') return 'list_item';
  if (tagName === 'td' || tagName === 'th') return 'table_cell';
  if (tagName === 'figcaption' || tagName === 'caption') return 'caption';
  if (tagName === 'a' || tagName === 'button' || tagName === 'span') return 'navigation';

  return 'paragraph';
}

/**
 * 创建 TranslationUnit
 */
function createUnit(
  element: HTMLElement,
  section: string | null,
  contextChain: string[],
  isInShadowDOM: boolean,
  isInIframe: boolean,
  config: ScannerConfig
): TranslationUnit | null {
  const text = getFullText(element).trim();

  // 过滤过短文本
  if (text.length < config.minTextLength) return null;

  // 过滤纯数字/符号
  if (/^[\d\s.,;:!?\-–—()\[\]{}"'«»<>+=\/*@#$%^&~`|\\]+$/.test(text)) return null;

  const inViewport = isInViewport(element);
  const priority = inViewport ? config.viewportPriorityBonus : 0;

  const unit: TranslationUnit = {
    id: `dt-${++idCounter}`,
    type: determineUnitType(element),
    element,
    originalText: text,
    htmlContext: element.tagName.toLowerCase(),
    contextChain: section ? [section, ...contextChain] : contextChain,
    isInShadowDOM,
    isInIframe,
    priority,
  };

  return unit;
}

/**
 * 重置 ID 计数器（测试用）
 */
export function resetCounter(): void {
  idCounter = 0;
}
