// DOM 扫描器 v2 | 递归深度遍历，修复外层容器跳过的 bug
import type { TranslationUnit, UnitType } from '../../shared/types';

/** 永久跳过的标签（内部不扫描任何文字） */
const SKIP_TAGS = new Set([
  'script', 'style', 'noscript',
  'code', 'pre',
  'iframe', 'svg',
]);

/** 整体跳过的语义容器（不递归进入） */
const SKIP_CONTAINERS = new Set([
  'nav', 'header', 'footer', 'aside',
]);

/** 视口内优先级 */
const VIEWPORT_PRIORITY = 10;

/** 全局计数器 */
let idCounter = 0;

/**
 * 扫描页面，提取所有需要翻译的文本单元
 */
export async function scanPage(
  root: HTMLElement = document.body
): Promise<TranslationUnit[]> {
  const units: TranslationUnit[] = [];
  scanElement(root, '', [], units);
  return units;
}

/**
 * 递归深度遍历 DOM，提取叶子文本节点
 * 核心逻辑：逐层深入，只跳过明确不可翻译的标签
 */
function scanElement(
  element: HTMLElement,
  section: string,
  contextChain: string[],
  result: TranslationUnit[]
): void {
  const tagName = element.tagName.toLowerCase();

  // 1. 永久跳过：代码/脚本/样式/svg/iframe
  if (SKIP_TAGS.has(tagName)) return;

  // 2. 整体跳过语义容器：nav/header/footer/aside
  if (SKIP_CONTAINERS.has(tagName)) return;

  // 3. 跳过已翻译标记
  if (element.hasAttribute('data-dt-translated')) return;

  // 4. 跳过 dt exclude 标记
  if (element.hasAttribute('data-dt-exclude')) return;

  // 5. 跳过隐藏元素
  if (isHidden(element)) return;

  // 6. 更新上下文链：标题作为 section
  let newSection = section;
  const newContextChain = [...contextChain];
  if (/^h[1-6]$/.test(tagName)) {
    const headingText = element.textContent?.trim() || '';
    if (headingText) {
      newSection = headingText;
      newContextChain.push(headingText);
    }
  }

  // 7. 判断是否为叶子：无子元素的文本节点
  const childElements = getChildElements(element);

  if (childElements.length === 0) {
    // 叶子节点：直接提取文本
    tryCreateUnit(element, newSection, newContextChain, result);
    return;
  }

  // 8. 有子元素时：逐层递归深入
  //    不再使用 BLOCK_CONTAINER_SELECTORS 判断是否跳过父级
  //    而是递归进入每个子元素，确保内部 p/li/a 等全部被扫描
  for (const child of childElements) {
    scanElement(child, newSection, newContextChain, result);
  }
}

/**
 * 获取元素的直接子元素（过滤空文本节点）
 */
function getChildElements(element: HTMLElement): HTMLElement[] {
  const result: HTMLElement[] = [];
  for (const node of element.childNodes) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      result.push(node as HTMLElement);
    }
  }
  return result;
}

/**
 * 尝试为叶子元素创建翻译单元
 */
function tryCreateUnit(
  element: HTMLElement,
  section: string,
  contextChain: string[],
  result: TranslationUnit[]
): void {
  const text = getCleanText(element);

  // 过滤纯空白
  if (!text) return;

  // 过滤纯数字/符号/标点
  if (/^[\d\s.,;:!?\-–—()\[\]{}"'«»<>+=\/*@#$%^&~`|\\]+$/.test(text)) return;

  const tagName = element.tagName.toLowerCase();
  const inViewport = isInViewport(element);
  const priority = inViewport ? VIEWPORT_PRIORITY : 0;

  const unit: TranslationUnit = {
    id: `dt-${++idCounter}`,
    type: determineUnitType(tagName),
    element,
    originalText: text,
    htmlContext: tagName,
    contextChain: section ? [section, ...contextChain] : contextChain,
    isInShadowDOM: false,
    isInIframe: false,
    priority,
  };

  result.push(unit);
}

/**
 * 获取元素纯净文本（innerText，去除多余空白）
 */
function getCleanText(element: HTMLElement): string {
  const raw = element.innerText || element.textContent || '';
  return raw
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 判断元素类型
 */
function determineUnitType(tagName: string): UnitType {
  if (/^h[1-6]$/.test(tagName)) return 'heading';
  if (tagName === 'p') return 'paragraph';
  if (tagName === 'li') return 'list_item';
  if (tagName === 'td' || tagName === 'th') return 'table_cell';
  if (tagName === 'figcaption' || tagName === 'caption') return 'caption';
  if (tagName === 'a' || tagName === 'button') return 'navigation';
  return 'paragraph';
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
 * 判断元素是否隐藏（display:none 或 visibility:hidden）
 */
function isHidden(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  return style.display === 'none' || style.visibility === 'hidden';
}

/**
 * 重置 ID 计数器
 */
export function resetCounter(): void {
  idCounter = 0;
}
