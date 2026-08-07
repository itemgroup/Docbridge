// DOM 扫描器 v6 | TreeWalker + 占位符标记法（<a>整体不切割）
import type { TranslationUnit, UnitType, InlineElementRef } from '../../shared/types';

/**
 * 永久跳过的标签（内部文本完全不扫描）
 * pre/script/style/svg/iframe
 * 注意：code 已从此集合移除，改为根据是否有 <pre> 祖先动态判断
 */
const SKIP_TAGS = new Set([
  'script', 'style', 'noscript',
  'pre',
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

/**
 * 语义行内标签：整体占位，不拆分内部 Text 节点
 * <a> 超链接：保持 href/class/target 等全部属性，防止链接被撕裂
 * <sup>/<sub>：上下标，整体保留语义
 * <code>：行内代码片段（无 <pre> 祖先），生成占位符保留原样
 */
const SEMANTIC_INLINE_TAGS = new Set(['a', 'sup', 'sub', 'code']);

/** hasPreAncestor 结果缓存（WeakMap 避免内存泄漏，元素移出 DOM 自动回收） */
const preAncestorCache = new WeakMap<HTMLElement, boolean>();

/** 检查元素是否有 <pre> 祖先（带缓存，避免重复遍历祖先链） */
function hasPreAncestor(element: HTMLElement): boolean {
  const cached = preAncestorCache.get(element);
  if (cached !== undefined) return cached;
  let parent: HTMLElement | null = element.parentElement;
  while (parent) {
    if (parent.tagName.toLowerCase() === 'pre') {
      preAncestorCache.set(element, true);
      return true;
    }
    parent = parent.parentElement;
  }
  preAncestorCache.set(element, false);
  return false;
}

/** 检查元素是否为隐藏（仅读 inline style + hidden 属性，不做昂贵的 getComputedStyle） */
function isElementHidden(el: HTMLElement): boolean {
  if (el.hidden) return true;
  const s = el.style;
  if (s.display === 'none' || s.visibility === 'hidden') return true;
  return false;
}

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
        // 提前过滤纯空白节点（仅空格/换行/制表符），减少后续处理
        const rawText = node.textContent || '';
        if (!rawText.trim()) return NodeFilter.FILTER_REJECT;

        if (isInsideSkippedArea(node)) return NodeFilter.FILTER_REJECT;

        // 跳过 display:none / hidden 隐藏元素的内部 Text
        const directParent = node.parentElement;
        if (directParent && isElementHidden(directParent)) {
          return NodeFilter.FILTER_REJECT;
        }

        // FIX: 跳过 <a>/<sup>/<sub>/<code> 内部的 Text 节点，防止切割
        if (directParent && SEMANTIC_INLINE_TAGS.has(directParent.tagName.toLowerCase())) {
          return NodeFilter.FILTER_REJECT;
        }

        const text = rawText.replace(/\s+/g, ' ').trim();
        if (!text) return NodeFilter.FILTER_REJECT;

        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  // 收集文本节点，按父元素分组（<a> 内部文本已被排除）
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

  // 组装 TranslationUnit：使用占位符序列化保留 <a> 完整性
  const units: TranslationUnit[] = [];
  const processedElements = new Set<HTMLElement>();

  for (const [parent] of parentMap) {
    // 检查祖先链是否已处理（避免 <p> 的 text 被包含到父 <div> 中重复处理）
    if (processedElements.has(parent)) continue;

    const tagName = parent.tagName.toLowerCase();

    // 使用占位符序列化：childNodes 中的 <a> 生成 {{TAG_N}} 占位符
    const { text, refs } = serializeWithPlaceholders(parent);

    // 去掉占位符后的纯文本长度检查
    const plainText = text.replace(/\{\{TAG_\d+\}\}/g, '').replace(/\s+/g, ' ').trim();
    if (plainText.length < 8) continue;

    const inViewport = isInViewport(parent);

    const unit: TranslationUnit = {
      id: `dt-${++idCounter}`,
      type: determineUnitType(tagName),
      element: parent,
      originalText: text,
      htmlContext: tagName,
      contextChain: buildContextChain(parent),
      isInShadowDOM: false,
      isInIframe: false,
      priority: inViewport ? VIEWPORT_PRIORITY : 0,
      inlineRefs: refs.length > 0 ? refs : undefined,
    };

    units.push(unit);
    processedElements.add(parent);
  }

  return units;
}

/**
 * 序列化父容器文本，将语义行内元素替换为 {{TAG_N}} 占位符
 *
 * 遍历父容器的直接子节点（childNodes）：
 * - Text 节点 → 直接拼接
 * - <a>/<sup>/<sub> → 生成 {{TAG_N}} 占位符，保存原始 DOM 引用
 * - <code> 无 <pre> 祖先 → 行内代码，生成占位符保留原样
 * - <code> 有 <pre> 祖先 → 块级代码，跳过
 * - pre → 跳过整棵子树（FILTER_REJECT 等效）
 * - script/style/iframe/svg → 跳过
 * - br → 空格
 * - 其他元素 → 提取 innerText
 *
 * 占位符不含元素文字，LLM 看到的是纯占位符标记，
 * 确保 LLM 不会修改/撕裂行内元素的内容。
 */
function serializeWithPlaceholders(
  element: HTMLElement
): { text: string; refs: InlineElementRef[] } {
  let result = '';
  const refs: InlineElementRef[] = [];
  let tagIdx = 0;

  for (const child of element.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      result += child.textContent || '';
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement;
      const tag = el.tagName.toLowerCase();

      // 跳过隐藏元素（display:none / hidden），减少无用占位符
      if (isElementHidden(el)) continue;

      // pre 整棵子树跳过（FILTER_REJECT 等效）
      if (tag === 'pre') continue;

      if (SKIP_TAGS.has(tag)) continue;

      // 语义行内标签：整体占位，不拆分内部文本
      if (SEMANTIC_INLINE_TAGS.has(tag)) {
        // code 有 pre 祖先 → 块级代码，跳过（FILTER_REJECT）
        if (tag === 'code' && hasPreAncestor(el)) continue;

        const placeholder = `{{TAG_${tagIdx}}}`;
        const innerText = (el.innerText || el.textContent || '').trim();
        refs.push({ placeholder, element: el, originalText: innerText });
        // 占位符两侧加空格，确保 LLM 识别为独立 token
        result += ` {{TAG_${tagIdx}}} `;
        tagIdx++;
      } else if (tag === 'br') {
        result += ' ';
      } else {
        // 其他元素：提取文本，不展开子结构
        result += el.innerText || el.textContent || '';
      }
    }
  }

  return {
    text: result.replace(/\s+/g, ' ').trim(),
    refs,
  };
}

/**
 * 判断文本节点是否在需要跳过的区域内部
 * 检查标签名、role 属性、CSS class
 */
function isInsideSkippedArea(node: Text): boolean {
  let parent: HTMLElement | null = node.parentElement;

  while (parent) {
    const tagName = parent.tagName.toLowerCase();

    // pre/script/style/svg/iframe
    if (SKIP_TAGS.has(tagName)) return true;

    // code: 仅当有 <pre> 祖先时视为跳过区域（块级代码），行内 code 不在此过滤
    if (tagName === 'code' && hasPreAncestor(parent)) return true;

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
