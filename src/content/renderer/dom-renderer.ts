// src/content/renderer/dom-renderer.ts — 译文渲染引擎：零侵入插入 + 显示模式切换 | DocBridge | 2025-08-06

import type { TranslatedUnit, DisplayMode } from '../../shared/types';
import {
  DT_BRIDGE_CLASS,
  DT_LABEL_CLASS,
  DT_TEXT_CLASS,
  DT_ID_ATTR,
} from '../../shared/constants';

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
   * 渲染译文：在每个单元元素内部末尾插入 dt-bridge 节点
   */
  render(units: TranslatedUnit[]): void {
    for (const unit of units) {
      try {
        this.renderOne(unit);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[DocBridge] 渲染单元 ${unit.id} 失败:`, msg);
      }
    }
  }

  /**
   * 切换显示模式（通过 body class，不操作 DOM 元素）
   */
  setMode(mode: DisplayMode): void {
    // 移除旧模式 class
    for (const cls of Object.values(MODE_CLASS_MAP)) {
      document.body.classList.remove(cls);
    }
    // 设置新模式
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
   * 清除所有译文节点和标记
   */
  clear(): void {
    const bridges = document.querySelectorAll(`.${DT_BRIDGE_CLASS}`);
    bridges.forEach((el) => el.remove());
    const translated = document.querySelectorAll(`[data-dt-translated]`);
    translated.forEach((el) => el.removeAttribute('data-dt-translated'));
    // 重置模式
    for (const cls of Object.values(MODE_CLASS_MAP)) {
      document.body.classList.remove(cls);
    }
  }

  // ---------- 私有方法 ----------

  /**
   * 渲染单个译文单元
   */
  private renderOne(unit: TranslatedUnit): void {
    const el = unit.originalUnit.element;
    // 元素引用为空或已不在 DOM 中，跳过
    if (!el || !document.contains(el)) return;
    // 已翻译过的跳过
    if (el.hasAttribute('data-dt-translated')) return;

    const wrapper = this.buildBridge(unit);
    el.appendChild(wrapper);
    el.setAttribute('data-dt-translated', 'true');
  }

  /**
   * 构建 dt-bridge 译文节点
   */
  private buildBridge(unit: TranslatedUnit): HTMLSpanElement {
    const wrapper = document.createElement('span');
    wrapper.className = DT_BRIDGE_CLASS;
    wrapper.setAttribute(DT_ID_ATTR, unit.id);
    wrapper.style.cssText =
      'display:block;margin-top:4px;padding:4px 0;border-left:3px solid #1890ff;padding-left:8px;';

    // 代码块用等宽字体
    if (unit.originalUnit.type === 'code_block') {
      wrapper.style.fontFamily = 'monospace';
      wrapper.style.backgroundColor = '#f6f8fa';
      wrapper.style.borderRadius = '4px';
    }

    // dt-label：[译] 标签
    const label = document.createElement('span');
    label.className = DT_LABEL_CLASS;
    label.style.cssText = 'color:#999;font-size:0.85em;margin-right:4px;';
    label.textContent = '[译]';

    // dt-text：译文正文
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
   */
  private injectStyles(): void {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .dt-mode-translated-only [data-dt-translated] {
        opacity: 0.15;
        transition: opacity 0.2s ease;
      }
      .dt-mode-translated-only [data-dt-translated]:hover {
        opacity: 1;
      }
      .dt-mode-translated-only .${DT_BRIDGE_CLASS} {
        opacity: 1 !important;
      }
      .dt-mode-original-only .${DT_BRIDGE_CLASS} {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }
}
