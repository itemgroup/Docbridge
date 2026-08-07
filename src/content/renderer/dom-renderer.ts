// 译文渲染引擎 v2 | 零侵入 DOM 插入 + 占位符回填
// 核心原则：不修改原始 DOM 节点，不替换/删除原文，不使用 innerHTML
import type { TranslatedUnit, DisplayMode, InlineElementRef } from '../../shared/types';

/** data-dt-translated 标记属性名 */
const TRANSLATED_ATTR = 'data-dt-translated';
/** 译文容器的 CSS 类名 */
const BRIDGE_CLASS = 'dt-bridge';

/**
 * 渲染译文
 * - 仅在原文元素内部追加译文节点
 * - 不修改原始 innerHTML
 * - 如果元素已有译文则跳过
 *
 * @param units - 已翻译单元数组
 * @param mode - 显示模式
 */
export function renderTranslation(
  units: TranslatedUnit[],
  mode: DisplayMode = 'bilingual'
): void {
  for (const unit of units) {
    const { originalUnit, translatedText } = unit;
    const element = originalUnit.element;

    // 安全检查：元素仍存在于 DOM
    if (!element || !element.isConnected) continue;

    // 已有译文则跳过
    if (element.querySelector(`.${BRIDGE_CLASS}`)) continue;
    if (element.hasAttribute(TRANSLATED_ATTR)) continue;

    // 译文与原文字相同则跳过
    if (translatedText === originalUnit.originalText) continue;

    // 标记已翻译
    element.setAttribute(TRANSLATED_ATTR, unit.id);

    // 创建译文节点
    const bridgeEl = createBridgeNode(unit);

    // 追加到原文元素内部末尾
    element.appendChild(bridgeEl);
  }

  // 应用显示模式
  applyDisplayMode(mode);
}

/**
 * 创建译文桥接节点
 *
 * 核心：解析 LLM 返回文本中的 {{TAG_N}} 占位符
 * - {{TAG_N}} → 深克隆原始 <a> DOM（保留 href/class/target 等全部属性）
 * - 普通文本 → createTextNode
 * - 全程禁止 innerHTML，不拆分/撕裂链接标签
 */
function createBridgeNode(unit: TranslatedUnit): HTMLElement {
  const { id, translatedText, originalUnit } = unit;
  const inlineRefs: InlineElementRef[] = originalUnit.inlineRefs || [];

  const wrapper = document.createElement('span');
  wrapper.className = BRIDGE_CLASS;
  wrapper.setAttribute('data-dt-id', id);

  // 内联样式（双语模式下显示蓝色边框）
  wrapper.style.cssText =
    'display:block;margin-top:6px;padding:6px 0 6px 10px;border-left:3px solid #1890ff;font-size:0.95em;line-height:1.6;color:#333;';

  // 无行内引用 → 纯文本模式
  if (inlineRefs.length === 0) {
    wrapper.title = translatedText;
    wrapper.textContent = translatedText;
    return wrapper;
  }

  // FIX: 解析占位符 {{TAG_N}}，区分普通文本与语义行内元素(a/sup/sub)
  // 使用 split 而非 replace，保留片段顺序
  const placeholderPattern = /(\{\{TAG_\d+\}\})/g;
  const parts = translatedText.split(placeholderPattern);

  for (const part of parts) {
    if (!part) continue;

    const match = part.match(/^\{\{TAG_(\d+)\}\}$/);
    if (match) {
      const idx = parseInt(match[1], 10);
      const ref = inlineRefs[idx];
      if (ref && ref.element) {
        // FIX: 语义行内元素(a/sup/sub) → 深克隆完整 DOM
        // cloneNode(true) 保留 href、class、target、子节点树等全部属性
        // 不使用 innerHTML，不拆分/修改 <a> 标签内部文字
        const clone = ref.element.cloneNode(true) as HTMLElement;
        wrapper.appendChild(clone);
      }
    } else if (part.trim()) {
      // 普通译文文本片段 → createTextNode
      wrapper.appendChild(document.createTextNode(part));
    }
  }

  wrapper.title = translatedText;
  return wrapper;
}

/**
 * 应用显示模式
 * - bilingual: 原文 + 译文都显示
 * - translated-only: 隐藏原文、显示译文（视觉与 Chrome 原生翻译一致）
 * - original-only: 隐藏译文、恢复原文
 */
export function applyDisplayMode(mode: DisplayMode): void {
  // 移除之前的模式 class
  document.body.classList.remove('dt-mode-bilingual', 'dt-mode-translated', 'dt-mode-original');

  switch (mode) {
    case 'bilingual':
      document.body.classList.add('dt-mode-bilingual');
      break;
    case 'translated-only':
      document.body.classList.add('dt-mode-translated');
      break;
    case 'original-only':
      document.body.classList.add('dt-mode-original');
      break;
  }
}

/**
 * 清除所有译文
 * - 删除所有 .dt-bridge 节点
 * - 清除 data-dt-translated 标记
 * - 恢复页面原始状态
 */
export function clearTranslation(): void {
  const bridges = document.querySelectorAll(`.${BRIDGE_CLASS}`);
  bridges.forEach((b) => b.remove());

  const translated = document.querySelectorAll(`[${TRANSLATED_ATTR}]`);
  translated.forEach((el) => el.removeAttribute(TRANSLATED_ATTR));

  document.body.classList.remove('dt-mode-bilingual', 'dt-mode-translated', 'dt-mode-original');

  console.log('[DocBridge Renderer] 已清除所有译文');
}

/**
 * 导出完整 HTML（包含译文）
 * @returns 完整页面 HTML 字符串
 */
export function exportHTML(): string {
  // 克隆整个文档
  const clone = document.documentElement.cloneNode(true) as HTMLElement;

  // 将注入的样式内联到克隆体
  const styleEl = document.getElementById('dt-inline-styles');
  if (styleEl && !clone.querySelector('#dt-inline-styles')) {
    const clonedStyle = styleEl.cloneNode(true);
    const head = clone.querySelector('head');
    if (head) {
      head.appendChild(clonedStyle);
    }
  }

  return '<!DOCTYPE html>\n' + clone.outerHTML;
}

/**
 * 注入全局样式表（仅执行一次）
 */
let stylesInjected = false;

export function injectGlobalStyles(): void {
  if (stylesInjected) return;
  stylesInjected = true;

  const style = document.createElement('style');
  style.id = 'dt-inline-styles';
  style.textContent = `
    /* 双语模式：默认 */
    body.dt-mode-bilingual .dt-bridge { display: block; }
    
    /* 仅译文模式：隐藏原文，显示译文（Chrome 原生翻译风格） */
    body.dt-mode-translated [data-dt-translated] { color: transparent !important; position: relative; }
    body.dt-mode-translated [data-dt-translated] > *:not(.dt-bridge) { color: transparent !important; }
    body.dt-mode-translated [data-dt-translated] .dt-bridge { 
      display: block; 
      border-left: none !important; 
      padding-left: 0 !important; 
      margin-top: 0 !important;
      color: #333 !important;
    }
    
    /* 仅原文模式：隐藏译文 */
    body.dt-mode-original .dt-bridge { display: none !important; }
  `;
  document.head.appendChild(style);
}
