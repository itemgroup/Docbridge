// src/content/renderer/dom-renderer.ts — 译文渲染引擎：零侵入插入 + 显示模式切换 + 导出 | DocBridge | 2025-08-06

import type { TranslatedUnit, DisplayMode } from '../../shared/types';

// 内容脚本必须输出为单文件 classic script，避免依赖共享 chunk。
const DT_BRIDGE_CLASS = 'dt-bridge';
const DT_LABEL_CLASS = 'dt-label';
const DT_TEXT_CLASS = 'dt-text';
const DT_ID_ATTR = 'data-dt-id';

/** 模式对应的 body class */
const MODE_CLASS_MAP: Record<DisplayMode, string> = {
  'bilingual': 'dt-mode-bilingual',
  'translated-only': 'dt-mode-translated-only',
  'original-only': 'dt-mode-original-only',
};

/** 内联样式 ID */
const STYLE_ID = 'docbridge-renderer-styles';

export class DOMRenderer {
  private currentMode: DisplayMode = 'bilingual';

  constructor() {
    this.injectStyles();
    this.setMode(this.currentMode);
  }

  /**
   * 渲染译文：在每个单元元素内部插入 dt-bridge 节点（作为第一个子节点）
   */
  render(units: TranslatedUnit[]): void {
    console.log('[DocBridge] DOMRenderer.render 收到', units.length, '个译文单元');
    let skipped = 0;
    let rendered = 0;
    for (const unit of units) {
      try {
        const result = this.renderOne(unit);
        if (result === 'skipped') skipped++;
        else if (result === 'rendered') rendered++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[DocBridge] 渲染单元 ${unit.id} 失败:`, msg);
      }
    }
    console.log(`[DocBridge] 渲染完成: ${rendered} 个已渲染, ${skipped} 个跳过`);
  }

  /**
   * 切换显示模式（通过 body class + CSS，不重新操作 DOM）
   */
  setMode(mode: DisplayMode): void {
    for (const cls of Object.values(MODE_CLASS_MAP)) {
      document.body.classList.remove(cls);
    }
    document.body.classList.add(MODE_CLASS_MAP[mode]);
    this.currentMode = mode;
  }

  /**
   * 获取当前显示模式
   */
  getMode(): DisplayMode {
    return this.currentMode;
  }

  /**
   * 清除所有译文节点和标记（确保可重新翻译）
   */
  clear(): void {
    // 1. 移除所有译文节点
    document.querySelectorAll(`.${DT_BRIDGE_CLASS}`).forEach((el) => el.remove());
    // 2. 清除所有标记属性
    document.querySelectorAll('[data-dt-processed], [data-dt-translated]').forEach((el) => {
      el.removeAttribute('data-dt-processed');
      el.removeAttribute('data-dt-translated');
    });
    // 3. 清除 body 上的模式 class
    for (const cls of Object.values(MODE_CLASS_MAP)) {
      document.body.classList.remove(cls);
    }
  }

  /**
   * 导出译文页面为 HTML 文件
   * 克隆当前 DOM，移除内部属性，保留译文文本，触发下载
   */
  exportHTML(): void {
    try {
      const clone = document.documentElement.cloneNode(true) as HTMLElement;

      // 移除所有扩展内部属性，保留译文文本
      clone.querySelectorAll('.dt-bridge').forEach((el) => {
        el.removeAttribute('data-dt-id');
        el.removeAttribute('title');
      });
      clone.querySelectorAll('[data-dt-processed], [data-dt-translated]').forEach((el) => {
        el.removeAttribute('data-dt-processed');
        el.removeAttribute('data-dt-translated');
      });
      // 移除控制栏
      const bar = clone.querySelector('#docbridge-floating-bar');
      if (bar) bar.remove();
      // 移除注入的样式
      const style = clone.querySelector(`#${STYLE_ID}`);
      if (style) style.remove();

      const html = '<!DOCTYPE html>\n' + clone.outerHTML;
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'translated-page.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('[DocBridge] 页面已导出为 translated-page.html');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[DocBridge] 导出失败:', msg);
    }
  }

  // ---------- 私有方法 ----------

  /**
   * 渲染单个译文单元
   * 将 bridge 插入为第一个子节点（便于仅译文模式 absolute 覆盖）
   */
  private renderOne(unit: TranslatedUnit): 'rendered' | 'skipped' {
    if (!unit.originalUnit) {
      return 'skipped';
    }
    const el = unit.originalUnit.element;
    if (!el || !document.contains(el)) {
      return 'skipped';
    }
    if (el.hasAttribute('data-dt-translated')) {
      return 'skipped';
    }

    const wrapper = this.buildBridge(unit);

    // 插入为第一个子节点（仅译文模式用 absolute 覆盖时更自然）
    if (el.firstChild) {
      el.insertBefore(wrapper, el.firstChild);
    } else {
      el.appendChild(wrapper);
    }
    el.setAttribute('data-dt-translated', 'true');
    return 'rendered';
  }

  /**
   * 构建 dt-bridge 译文节点（原生 title + 自动换行）
   */
  private buildBridge(unit: TranslatedUnit): HTMLSpanElement {
    const wrapper = document.createElement('span');
    wrapper.className = DT_BRIDGE_CLASS;
    wrapper.setAttribute(DT_ID_ATTR, unit.id);
    // 浏览器原生 tooltip 显示完整译文
    wrapper.title = unit.translatedText;
    wrapper.style.cssText = [
      'display:block',
      'margin-top:4px',
      'padding:4px 0',
      'border-left:3px solid #1890ff',
      'padding-left:8px',
      'white-space:normal',
      'word-break:break-word',
      'overflow-wrap:break-word',
      'position:relative',
      'z-index:1',
    ].join(';');

    if (unit.originalUnit?.type === 'code_block') {
      wrapper.style.fontFamily = 'monospace';
      wrapper.style.backgroundColor = '#f6f8fa';
      wrapper.style.borderRadius = '4px';
    }

    // 从父元素复制字体样式（仅译文模式覆盖时字体一致）
    if (unit.originalUnit?.element) {
      const parentStyle = window.getComputedStyle(unit.originalUnit.element);
      wrapper.style.fontSize = parentStyle.fontSize;
      wrapper.style.fontFamily = parentStyle.fontFamily;
      wrapper.style.lineHeight = parentStyle.lineHeight;
      wrapper.style.fontWeight = parentStyle.fontWeight;
    }

    const label = document.createElement('span');
    label.className = DT_LABEL_CLASS;
    label.style.cssText = 'color:#999;font-size:0.85em;margin-right:4px;';
    label.textContent = '[译]';

    const text = document.createElement('span');
    text.className = DT_TEXT_CLASS;
    text.style.cssText = 'color:#333;';
    text.textContent = unit.translatedText;

    wrapper.appendChild(label);
    wrapper.appendChild(text);
    return wrapper;
  }

  /**
   * 注入显示模式控制的 CSS 样式
   * 仅译文模式：原文 visibility:hidden，译文 absolute 覆盖
   */
  private injectStyles(): void {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      /* 双语模式：译文正常流 */
      .dt-mode-bilingual .${DT_BRIDGE_CLASS} {
        position: relative !important;
        display: block !important;
      }

      /* 仅译文模式：原文隐藏占位，译文 absolute 覆盖 */
      .dt-mode-translated-only [data-dt-translated] {
        visibility: hidden;
        position: relative;
      }
      .dt-mode-translated-only [data-dt-translated] > .${DT_BRIDGE_CLASS} {
        visibility: visible;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        background: transparent;
        color: inherit;
        z-index: 1;
        display: flex;
        align-items: center;
        white-space: normal;
        word-break: break-word;
      }

      /* 仅原文模式：隐藏译文 */
      .dt-mode-original-only .${DT_BRIDGE_CLASS} {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }
}
