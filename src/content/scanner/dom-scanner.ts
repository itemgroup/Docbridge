// src/content/scanner/dom-scanner.ts — DOM 扫描器：识别主内容区并生成翻译单元 | DocBridge | 2025-08-06

import type { TranslationUnit, UnitType } from '../../shared/types';

/** 主内容区候选选择器（按优先级） */
const MAIN_SELECTORS = [
  'article', 'main', '[role="main"]', '.content', '.documentation',
  '.markdown-body', '.post-content', '.article-content', '.entry-content',
];

/** 排除区块的选择器 */
const EXCLUDE_SELECTORS = [
  'nav', 'header', 'footer', 'aside',
  '[role="banner"]', '[role="complementary"]', '[role="navigation"]',
  '.sidebar', '.nav', '.menu', '.advertisement', '.cookie-banner', '.announcement',
];

/** 排除的 class/id 关键词 */
const EXCLUDE_KEYWORDS = ['nav', 'footer', 'sidebar', 'ad-', 'cookie', 'comment'];

/** 行内元素标签（不作独立翻译单元） */
const INLINE_TAGS = new Set(['A', 'CODE', 'STRONG', 'EM', 'SPAN', 'B', 'I', 'U', 'SMALL', 'MARK', 'SUB', 'SUP']);

/** 应跳过的标签 */
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'BR', 'HR']);

/** 最小文本长度 */
const MIN_TEXT_LENGTH = 3;

export class DOMScanner {
  /**
   * 扫描页面 DOM，生成 TranslationUnit 列表
   * @param root - 可选根元素，不传则自动定位主内容区
   */
  scan(root?: HTMLElement): TranslationUnit[] {
    const container = root ?? this.findMainContent();
    const units: TranslationUnit[] = [];
    this.walk(container, units, null);
    return units;
  }

  /**
   * 定位主内容区：按优先选择器查找，未找到则回退 body 并排除非内容区
   */
  private findMainContent(): HTMLElement {
    for (const sel of MAIN_SELECTORS) {
      const el = document.querySelector(sel);
      if (el instanceof HTMLElement) return el;
    }
    // 回退到 body，先排除非内容区域
    const body = document.body;
    const clone = body.cloneNode(true) as HTMLElement;
    EXCLUDE_SELECTORS.forEach((sel) => {
      clone.querySelectorAll(sel).forEach((e) => e.remove());
    });
    return body;
  }

  /**
   * 递归遍历 DOM 树，对符合条件的节点生成 TranslationUnit
   * @param el - 当前元素
   * @param units - 收集结果
   * @param parentHeading - 向上找到的最近标题文本
   */
  private walk(el: HTMLElement, units: TranslationUnit[], parentHeading: string | null): void {
    if (this.shouldSkip(el)) return;

    const tag = el.tagName.toUpperCase();
    const unitType = this.getElementType(tag, el);

    if (unitType !== null) {
      const text = this.extractText(el);
      if (this.isValidText(text)) {
        // 向上查找最近标题作为上下文链
        const heading = unitType === 'heading'
          ? text
          : this.findNearestHeading(el);
        const contextChain = heading ? [heading] : [];
        units.push(this.buildUnit(el, unitType, text, contextChain));
        // 标记已处理
        el.setAttribute('data-dt-processed', 'true');
      }
    }

    // 继续遍历子元素
    const headingForChildren = unitType === 'heading'
      ? this.extractText(el)
      : parentHeading;

    for (let i = 0; i < el.children.length; i++) {
      const child = el.children[i];
      if (child instanceof HTMLElement) {
        this.walk(child, units, headingForChildren);
      }
    }
  }

  /**
   * 判断元素是否应跳过
   */
  private shouldSkip(el: HTMLElement): boolean {
    if (el.hasAttribute('data-dt-processed')) return true;
    if (SKIP_TAGS.has(el.tagName.toUpperCase())) return true;
    // 检查排除关键词
    const classAndId = (el.className + ' ' + el.id).toLowerCase();
    if (EXCLUDE_KEYWORDS.some((kw) => classAndId.includes(kw))) return true;
    return false;
  }

  /**
   * 根据标签和 DOM 位置判断翻译单元类型
   * 行内元素返回 null（不作为独立单元）
   */
  private getElementType(tag: string, el: HTMLElement): UnitType | null {
    switch (tag) {
      case 'H1': case 'H2': case 'H3': case 'H4': case 'H5': case 'H6':
        return 'heading';
      case 'P':
        return 'paragraph';
      case 'LI':
        return 'list_item';
      case 'TD': case 'TH':
        return 'table_cell';
      case 'FIGCAPTION':
        return 'caption';
      default: {
        // pre > code 是 code_block（只处理 pre 元素本身，其子 code 不独立）
        if (tag === 'PRE') {
          const codeChild = el.querySelector('code');
          return codeChild ? 'code_block' : null;
        }
        // div 仅当包含纯文本子内容时作为 paragraph
        if (tag === 'DIV' && this.containsTextNode(el)) {
          return 'paragraph';
        }
        // class 含 caption 的元素
        if (el.classList.contains('caption')) {
          return 'caption';
        }
        // 行内元素不独立
        if (INLINE_TAGS.has(tag)) return null;
        return null;
      }
    }
  }

  /**
   * 提取元素纯文本，排除 script/style 子节点
   */
  private extractText(el: HTMLElement): string {
    const clone = el.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('script, style').forEach((n) => n.remove());
    return (clone.textContent ?? '').replace(/\s+/g, ' ').trim();
  }

  /**
   * 验证文本是否有效：非空、长度足够、非纯数字/符号
   */
  private isValidText(text: string): boolean {
    if (text.length < MIN_TEXT_LENGTH) return false;
    // 纯数字或纯符号则跳过
    if (/^[\d\s.,;:!?@#$%^&*()_+\-=[\]{}|/\\<>~`'"\u00A0-\u00FF]+$/.test(text)) return false;
    return true;
  }

  /**
   * 向上查找最近的 h1-h6 标题文本
   */
  private findNearestHeading(el: HTMLElement): string | null {
    let current: HTMLElement | null = el.parentElement;
    while (current) {
      const tag = current.tagName.toUpperCase();
      if (/^H[1-6]$/.test(tag)) {
        return (current.textContent ?? '').trim();
      }
      current = current.parentElement;
    }
    return null;
  }

  /**
   * 检查 div 元素内部是否包含纯文本节点
   */
  private containsTextNode(el: HTMLElement): boolean {
    for (let i = 0; i < el.childNodes.length; i++) {
      const node = el.childNodes[i];
      if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
        return true;
      }
    }
    return false;
  }

  /**
   * 构建 TranslationUnit 对象
   */
  private buildUnit(
    el: HTMLElement,
    type: UnitType,
    text: string,
    contextChain: string[],
  ): TranslationUnit {
    return {
      id: 'u_' + Math.random().toString(36).substring(2, 11),
      type,
      element: el,
      originalText: text,
      htmlContext: el.innerHTML.trim(),
      contextChain,
      isInShadowDOM: el.getRootNode() instanceof ShadowRoot,
      isInIframe: window.self !== window.top,
      // 视口内优先级更高
      priority: el.getBoundingClientRect().top < window.innerHeight ? 10 : 5,
    };
  }
}
