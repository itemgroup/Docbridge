// src/content/renderer/dom-renderer.ts — 译文渲染引擎：零侵入插入 + 显示模式切换 | DocBridge | 2025-08-06

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
   * 渲染译文：在每个单元元素内部末尾插入 dt-bridge 节点
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
   * 清除所有译文节点和标记（包括 scanner 的 data-dt-processed，确保可重新翻译）
   */
  clear(): void {
    // 1. 移除所有 .dt-bridge 节点
    document.querySelectorAll(`.${DT_BRIDGE_CLASS}`).forEach((el) => el.remove());
    // 2. 移除所有 data-dt-translated 标记
    document.querySelectorAll('[data-dt-translated]').forEach((el) => {
      el.removeAttribute('data-dt-translated');
    });
    // 3. 移除所有 data-dt-processed 标记（关键！否则 scanner 会跳过）
    document.querySelectorAll('[data-dt-processed]').forEach((el) => {
      el.removeAttribute('data-dt-processed');
    });
    // 4. 隐藏 tooltip（如果存在）
    const tooltip = document.getElementById('dt-tooltip');
    if (tooltip) tooltip.style.display = 'none';
    // 5. 重置模式
    for (const cls of Object.values(MODE_CLASS_MAP)) {
      document.body.classList.remove(cls);
    }
  }

  // ---------- 私有方法 ----------

  /**
   * 渲染单个译文单元，返回 'rendered' | 'skipped' 用于统计
   */
  private renderOne(unit: TranslatedUnit): 'rendered' | 'skipped' {
    if (!unit.originalUnit) {
      console.warn(`[DocBridge] 跳过 ${unit.id}: originalUnit 为 null (SW 无 DOM)`);
      return 'skipped';
    }
    const el = unit.originalUnit.element;
    if (!el) {
      console.warn(`[DocBridge] 跳过 ${unit.id}: element 引用为空`);
      return 'skipped';
    }
    if (!document.contains(el)) {
      console.warn(`[DocBridge] 跳过 ${unit.id}: 元素已脱离 DOM`);
      return 'skipped';
    }
    if (el.hasAttribute('data-dt-translated')) {
      return 'skipped';
    }

    const wrapper = this.buildBridge(unit);
    el.appendChild(wrapper);
    el.setAttribute('data-dt-translated', 'true');
    return 'rendered';
  }

  /**
   * 构建 dt-bridge 译文节点（含 tooltip 事件 + 自动换行样式）
   */
  private buildBridge(unit: TranslatedUnit): HTMLSpanElement {
    const wrapper = document.createElement('span');
    wrapper.className = DT_BRIDGE_CLASS;
    wrapper.setAttribute(DT_ID_ATTR, unit.id);
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

    // 代码块用等宽字体
    if (unit.originalUnit?.type === 'code_block') {
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

    // 绑定 tooltip 事件
    this.bindTooltip(wrapper, unit.translatedText);

    return wrapper;
  }

  /**
   * 绑定 tooltip：mouseenter 显示完整译文，mouseleave 隐藏
   */
  private bindTooltip(el: HTMLElement, fullText: string): void {
    el.addEventListener('mouseenter', (e: MouseEvent) => {
      const tooltip = this.ensureTooltip();
      tooltip.textContent = fullText;
      tooltip.style.display = 'block';
      this.positionTooltip(tooltip, e);
    });
    el.addEventListener('mousemove', (e: MouseEvent) => {
      const tooltip = document.getElementById('dt-tooltip');
      if (tooltip && tooltip.style.display !== 'none') {
        this.positionTooltip(tooltip, e);
      }
    });
    el.addEventListener('mouseleave', () => {
      const tooltip = document.getElementById('dt-tooltip');
      if (tooltip) tooltip.style.display = 'none';
    });
  }

  /**
   * 确保全局 tooltip 元素存在
   */
  private ensureTooltip(): HTMLElement {
    const existing = document.getElementById('dt-tooltip');
    if (existing) return existing;
    const tooltip = document.createElement('div');
    tooltip.id = 'dt-tooltip';
    tooltip.style.cssText = [
      'position:fixed',
      'display:none',
      'background:rgba(0,0,0,0.9)',
      'color:#fff',
      'padding:8px 12px',
      'border-radius:4px',
      'font-size:13px',
      'max-width:400px',
      'z-index:99999',
      'line-height:1.5',
      'pointer-events:none',
      'white-space:normal',
      'word-break:break-word',
    ].join(';');
    document.body.appendChild(tooltip);
    return tooltip;
  }

  /**
   * 定位 tooltip 到鼠标上方 8px
   */
  private positionTooltip(tooltip: HTMLElement, e: MouseEvent): void {
    const offsetX = 12;
    const offsetY = 8;
    let left = e.clientX + offsetX;
    let top = e.clientY - tooltip.offsetHeight - offsetY;

    // 边界修正：不超出视口
    if (left + tooltip.offsetWidth > window.innerWidth - 8) {
      left = window.innerWidth - tooltip.offsetWidth - 8;
    }
    if (top < 8) {
      top = e.clientY + offsetY; // 显示在鼠标下方
    }
    if (left < 8) left = 8;

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
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
