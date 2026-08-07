// DOM 扫描器 v5 | 正文区域限定 + UI 元素排除 + 文本长度过滤
import type { TranslationUnit, UnitType } from '../../shared/types';

/**
 * 永久跳过的标签（内部文本完全不扫描）
 * code/pre 代码块、脚本、样式、svg、iframe
 */
const SKIP_TAGS = new Set([
  'script', 'style', 'noscript',
  'code', 'pre',
  'iframe', 'svg',
]);

/**
 * 需跳过的标签（导航 / UI 组件 / 表单控件）
 * 仅 main/article 内部段落正文的文本才会被扫描
 */
const SKIP_CONTAINER_TAGS = new Set([
  'nav', 'aside', 'header', 'footer',
  'button', 'input', 'select', 'textarea',
]);

/** 需跳过的 [role] 属性值 */
const SKIP_ROLES = new Set([
  'navigation', 'menu', 'menubar', 'button',
  'banner', 'contentinfo', 'complementary',
  'search', 'form',
]);

/** 需跳过的 CSS class 关键词 */
const SKIP_CLASS_KEYWORDS = [
  'nav', 'menu', 'sidebar', 'header', 'footer',
  'breadcrumb', 'pagination', 'toc', 'table-of-contents',
  'cookie', 'banner', 'ad', 'advertisement',
  'comment', 'social', 'share',
];

/** 视口内优先级 */
const VIEWPORT_PRIORITY = 10;

/** 全局计数器 */
let idCounter = 0;

/**
 * 扫描页面正文区域
 * 优先寻找 <main>/<article>，找不到则 fallback 到 body
 */
export async function scanPage(
  root?: HTMLElement
): Promise<TranslationUnit[]> {
  const scanRoot = root || findContentRoot();
  const units = scanTextNodes(scanRoot);

  // 调试
  (window as unknown as Record<string, unknown>).__translationUnits = units;

  return units;
}

/**
 * 寻找页面正文容器：<main> → <article> → body
 */
function findContentRoot(): HTMLElement {
  const main = document.querySelector('main');
  if (main) return main as HTMLElement;

  const article = document.querySelector('article');
  if (article) return article as HTMLElement;

  return document.body;
}

/**
 * TreeWalker 遍历 Text 节点，按父元素分组合并
 * 跳过导航/侧边栏/页脚/按钮/表单控件内部文本
 */
function scanTextNodes(root: HTMLElement): TranslationUnit[] {
  const parentMap = new Map<HTMLElement, string[]>();

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node: Text): number => {
        if (isInsideSkippedArea(node)) return NodeFilter.FILTER_REJECT;

        const text = (node.textContent || '').replace(/\s+/g, ' ').trim();
        if (!text) return NodeFilter.FILTER_REJECT;

        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  // 收集文本节点，按父元素分组
  let textNode: Text | null;
  while ((textNode = walker.nextNode() as Text | null)) {
    const raw = (textNode.textContent || '').replace(/\s+/g, ' ').trim();

    // 过滤过短文本（< 8 字符），丢弃 UI 碎片、单个单词
    if (raw.length < 8) continue;

    // 过滤纯数字/符号/标点
    if (/^[\d\s.,;:!?\-–—()\[\]{}"'«»<>+=\/*@#$%^&~`|\\]+$/.test(raw)) continue;

    const parent = textNode.parentElement;
    if (!parent) continue;
    if (parent.hasAttribute('data-dt-translated')) continue;

    // 父元素本身是跳过标签 → 丢弃
    if (SKIP_CONTAINER_TAGS.has(parent.tagName.toLowerCase())) continue;

    if (!parentMap.has(parent)) {
      parentMap.set(parent, []);
    }
    parentMap.get(parent)!.push(raw);
  }

  // 组装 TranslationUnit
  const units: TranslationUnit[] = [];
  for (const [parent, texts] of parentMap) {
    const combinedText = texts.join(' ');
    if (combinedText.length < 8) continue;

    const tagName = parent.tagName.toLowerCase();
    const inViewport = isInViewport(parent);

    const unit: TranslationUnit = {
      id: `dt-${++idCounter}`,
      type: determineUnitType(tagName),
      element: parent,
      originalText: combinedText,
      htmlContext: tagName,
      contextChain: buildContextChain(parent),
      isInShadowDOM: false,
      isInIframe: false,
      priority: inViewport ? VIEWPORT_PRIORITY : 0,
    };

    units.push(unit);
  }

  return units;
}

/**
 * 判断文本节点是否在需要跳过的区域内部
 * 检查标签名、role 属性、CSS class
 */
function isInsideSkippedArea(node: Text): boolean {
  let parent: HTMLElement | null = node.parentElement;

  while (parent) {
    const tagName = parent.tagName.toLowerCase();

    // code/pre/script/style/svg/iframe
    if (SKIP_TAGS.has(tagName)) return true;

    // nav/aside/header/footer/button/input/select
    if (SKIP_CONTAINER_TAGS.has(tagName)) return true;

    // [role] 属性
    const role = parent.getAttribute('role');
    if (role && SKIP_ROLES.has(role)) return true;

    // CSS class 关键词
    const className = parent.className;
    if (typeof className === 'string') {
      const lowerClass = className.toLowerCase();
      for (const keyword of SKIP_CLASS_KEYWORDS) {
        if (lowerClass.includes(keyword)) return true;
      }
    }

    parent = parent.parentElement;
  }

  return false;
}

/**
 * 向上遍历 DOM 构建上下文链（收集 h1-h6 标题文本）
 */
function buildContextChain(element: HTMLElement): string[] {
  const chain: string[] = [];
  let current: HTMLElement | null = element.parentElement;

  while (current) {
    const tagName = current.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tagName)) {
      const text = (current.textContent || '').replace(/\s+/g, ' ').trim();
      if (text) chain.unshift(text);
    }
    current = current.parentElement;
  }

  return chain;
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
  if (tagName === 'a') return 'navigation';
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
 * 重置 ID 计数器
 */
export function resetCounter(): void {
  idCounter = 0;
}
