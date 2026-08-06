// src/content/renderer/dom-renderer.ts — 纯 CSS 驱动模式切换，零文本节点修改 | DocBridge | 2025-08-06

import type { TranslatedUnit, DisplayMode } from '../../shared/types';

const MODE_PREFIX = 'dt-mode';
const STYLE_ID = 'docbridge-renderer-styles';

export class DOMRenderer {
  private currentMode: DisplayMode = 'bilingual';

  constructor() {
    this.injectStyles();
  }

  // ======================== 公开 API ========================

  /**
   * 渲染译文：包裹直接文本节点便于 CSS 控制 + 追加 .dt-bridge 到尾
   * 不动任何子元素，不修改任何文本节点内容
   */
  render(units: TranslatedUnit[]): void {
    let rendered = 0;
    for (const unit of units) {
      try {
        if (this.renderOne(unit)) rendered++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[DocBridge] 渲染单元 ${unit.id} 失败:`, msg);
      }
    }
    if (rendered > 0) {
      document.body.classList.add(`${MODE_PREFIX}-bilingual`);
    }
    console.log(`[DocBridge] 渲染完成: ${rendered} 个`);
  }

  /**
   * 切换显示模式：仅操作 body class，CSS 自动控制文本节点和 bridge 的显隐
   * 三种模式切换不调用 API、不重新扫描、不修改任何文本节点
   */
  setMode(mode: DisplayMode): void {
    this.currentMode = mode;
    document.body.classList.remove(
      `${MODE_PREFIX}-bilingual`,
      `${MODE_PREFIX}-translated-only`,
      `${MODE_PREFIX}-original-only`
    );
    document.body.classList.add(`${MODE_PREFIX}-${mode}`);
  }

  getMode(): DisplayMode {
    return this.currentMode;
  }

  /**
   * 清除所有：解包 .dt-text-node → 移除 .dt-bridge → 清除属性
   * 完全恢复到翻译前的 DOM 结构
   */
  clear(): void {
    document.querySelectorAll('[data-dt-translated]').forEach((el) => {
      const htmlEl = el as HTMLElement;

      // 解包所有 .dt-text-node：将文本节点移回父元素
      const wrappers = htmlEl.querySelectorAll<HTMLElement>('.dt-text-node');
      // 从后向前处理，避免 DOM 遍历问题
      for (let i = wrappers.length - 1; i >= 0; i--) {
        const wrapper = wrappers[i];
        while (wrapper.firstChild) {
          wrapper.parentNode!.insertBefore(wrapper.firstChild, wrapper);
        }
        wrapper.remove();
      }

      // 移除 .dt-bridge
      const bridge = htmlEl.querySelector<HTMLElement>('.dt-bridge');
      if (bridge) bridge.remove();

      // 移除所有 data-dt-* 属性
      htmlEl.removeAttribute('data-dt-translated');
      htmlEl.removeAttribute('data-dt-id');
      htmlEl.removeAttribute('data-dt-original-text');
      htmlEl.removeAttribute('data-dt-translated-text');
    });

    document.querySelectorAll('[data-dt-processed]').forEach((el) => {
      el.removeAttribute('data-dt-processed');
    });

    document.body.classList.remove(
      `${MODE_PREFIX}-bilingual`,
      `${MODE_PREFIX}-translated-only`,
      `${MODE_PREFIX}-original-only`
    );
  }

  /**
   * 导出译文页面（仅译文模式效果）
   */
  exportHTML(): void {
    try {
      const clone = document.documentElement.cloneNode(true) as HTMLElement;

      clone.querySelectorAll('[data-dt-translated]').forEach((el) => {
        const htmlEl = el as HTMLElement;
        const bridge = htmlEl.querySelector('.dt-bridge');
        if (bridge) bridge.remove();

        const transText = htmlEl.getAttribute('data-dt-translated-text');
        if (transText) {
          htmlEl.textContent = transText;
        }

        htmlEl.removeAttribute('data-dt-translated');
        htmlEl.removeAttribute('data-dt-id');
        htmlEl.removeAttribute('data-dt-original-text');
        htmlEl.removeAttribute('data-dt-translated-text');
      });

      clone.querySelectorAll('[data-dt-processed]').forEach((el) => {
        el.removeAttribute('data-dt-processed');
      });

      const bar = clone.querySelector('#docbridge-floating-bar');
      if (bar) bar.remove();

      const html = '<!DOCTYPE html>\n' + clone.outerHTML;
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      const safeName = document.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_').slice(0, 80);
      a.download = `translated-${safeName || 'page'}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);

      console.log('[DocBridge] 页面已导出');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[DocBridge] 导出失败:', msg);
    }
  }

  // ======================== 私有：渲染单个单元 ========================

  /**
   * 渲染单个单元：
   * 1. 每个直接文本节点用 <span class="dt-text-node"> 包裹（CSS 控制显隐，inline 无布局影响）
   * 2. 设置 data-dt-original-text / data-dt-translated-text 属性（数据层）
   * 3. 追加 .dt-bridge 到最后（唯一新增的可见节点）
   * 不移动任何子元素，不修改任何文本内容
   */
  private renderOne(unit: TranslatedUnit): boolean {
    if (!unit.originalUnit) return false;
    const el = unit.originalUnit.element;
    if (!el || !document.contains(el)) return false;
    if (el.hasAttribute('data-dt-translated')) return false;

    // 安全检查：如果元素内部已有被翻译的子元素或 bridge 子元素，跳过
    // 防止大容器（如 body/main/article）被意外渲染，导致译文堆叠在页面底部
    if (el.querySelector('[data-dt-translated]')) return false;
    if (el.querySelector('.dt-bridge')) return false;

    // 代码块：只标记，不修改任何 DOM
    if (unit.originalUnit.type === 'code_block') {
      return this.markOnly(el, unit);
    }

    // 每个直接文本节点用 inline span 包裹，便于 CSS 控制显隐
    // 使用 insertBefore + appendChild 保持 text 节点引用不变
    for (const child of Array.from(el.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        const wrapper = document.createElement('span');
        wrapper.className = 'dt-text-node';
        wrapper.style.cssText = ''; // 无额外样式，纯 inline
        el.insertBefore(wrapper, child);
        wrapper.appendChild(child);
      }
    }

    // 数据层：保存原文和译文到属性，永不丢失直到 clear()
    el.setAttribute('data-dt-original-text', el.textContent || '');
    el.setAttribute('data-dt-translated-text', unit.translatedText);

    // 追加 .dt-bridge 译文节点（最后，不影响原有布局）
    const bridge = document.createElement('span');
    bridge.className = 'dt-bridge';
    bridge.setAttribute('data-dt-id', unit.id);
    bridge.textContent = unit.translatedText;
    bridge.title = unit.translatedText;
    el.appendChild(bridge);

    el.setAttribute('data-dt-translated', 'true');
    el.setAttribute('data-dt-id', unit.id);

    return true;
  }

  /**
   * 仅标记（代码块）：不修改任何 DOM 内容
   */
  private markOnly(el: HTMLElement, unit: TranslatedUnit): boolean {
    el.setAttribute('data-dt-translated', 'true');
    el.setAttribute('data-dt-id', unit.id);
    return true;
  }

  // ======================== 私有：样式注入 ========================

  private injectStyles(): void {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      /* .dt-text-node 是 inline span，包裹原文本节点，默认不影响布局 */
      .dt-text-node { }

      /* 译文桥接节点基础样式 */
      .dt-bridge {
        display: block;
        margin-top: 4px;
        padding: 4px 0;
        border-left: 3px solid #1890ff;
        padding-left: 8px;
        color: #333;
        white-space: normal;
        word-break: break-word;
        overflow-wrap: break-word;
      }

      /* ===== 双语模式：原文原位 + 译文蓝框 ===== */
      .dt-mode-bilingual .dt-text-node { /* visible */ }
      .dt-mode-bilingual .dt-bridge { display: block; }

      /* ===== 仅译文模式：隐藏原文文本，只显示译文 ===== */
      .dt-mode-translated-only .dt-text-node { display: none; }
      .dt-mode-translated-only .dt-bridge {
        display: block;
        /* 类 Chrome 内置翻译：无蓝框标记，纯文本 */
        border-left: none !important;
        padding-left: 0 !important;
        background: none !important;
        margin-top: 0;
        padding-top: 0;
        padding-bottom: 0;
        color: inherit;
      }

      /* ===== 仅原文模式：隐藏译文 ===== */
      .dt-mode-original-only .dt-text-node { /* visible */ }
      .dt-mode-original-only .dt-bridge { display: none; }
    `;
    document.head.appendChild(style);
  }
}
