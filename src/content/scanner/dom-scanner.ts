// src/content/scanner/dom-scanner.ts — DOM 扫描器：识别主内容区并生成翻译单元 | DocBridge | 2025-08-06

import type { TranslationUnit, UnitType } from '../../shared/types';

/** 主内容区候选选择器（按优先级） */
const MAIN_SELECTORS = [
  'article', 'main', '[role="main"]', '.content', '#content', '.main',
  '.documentation', '.markdown-body', '.post-content', '.article-content', '.entry-content',
  '.main-content', '#main', '.docs', '.readme',
];

/** 排除区块的选择器（仅排除明确的导航/页脚/广告元素） */
const EXCLUDE_SELECTORS = [
  'nav', 'header[role="banner"]', 'footer',
  '[role="navigation"]', '[role="banner"]',
  '.sidebar', '.advertisement', '.cookie-banner', '.announcement',
];

/** 排除的 class/id 关键词（仅匹配完整单词，避免误排除 "navigation" 之类） */
const EXCLUDE_KEYWORDS = ['ad-', 'advertisement', 'cookie-banner', 'comment-section', 'social-share'];

/** 行内元素标签（不作独立翻译单元，但其长文本 span 会被扫描） */
const INLINE_TAGS = new Set(['CODE', 'STRONG', 'EM', 'B', 'I', 'U', 'SMALL', 'MARK', 'SUB', 'SUP']);

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
    // 回退到 body，walk() 遍历时会通过 shouldSkip() 排除非内容区域
    return document.body;
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
    // 双重保险：如果元素内已有译文节点，说明已处理过
    if (el.querySelector('.dt-bridge')) return true;
    if (SKIP_TAGS.has(el.tagName.toUpperCase())) return true;
    // 跳过不可见元素（display:none 或 visibility:hidden）
    if (!this.isVisible(el)) return true;
    // 检查排除关键词
    const classAndId = (el.className + ' ' + el.id).toLowerCase();
    if (EXCLUDE_KEYWORDS.some((kw) => classAndId.includes(kw))) return true;
    return false;
  }

  /**
   * 检查元素是否可见
   */
  private isVisible(el: HTMLElement): boolean {
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    if (parseFloat(style.opacity) === 0) return false;
    return true;
  }

  /**
   * 根据标签和 DOM 位置判断翻译单元类型
   * 扩大扫描范围：span(a), section, blockquote, dd, dt 等
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
      case 'SECTION':
        return 'paragraph';
      case 'BLOCKQUOTE':
        return 'paragraph';
      case 'DD': case 'DT':
        return 'list_item';
      case 'A': {
        // a 标签：仅当文本长度 > 10 且不是导航链接（不在 nav 内，href 不是纯锚点）
        if (el.closest('nav')) return null;
        const href = el.getAttribute('href') ?? '';
        if (href.startsWith('#') && href.length <= 10) return null;
        const text = this.extractText(el);
        if (text.length > 10) return 'paragraph';
        return null;
      }
      case 'SPAN': {
        // span：仅当文本长度 > 30 且父元素不是 p/div（避免重复）
        const parent = el.parentElement;
        if (parent) {
          const pTag = parent.tagName.toUpperCase();
          if (pTag === 'P' || pTag === 'DIV' || pTag === 'LI' || pTag === 'TD' || pTag === 'TH') return null;
        }
        const text = this.extractText(el);
        if (text.length > 30) return 'paragraph';
        return null;
      }
      default: {
        // pre > code 是 code_block
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
