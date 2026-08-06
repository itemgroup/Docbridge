const MAIN_SELECTORS = [
  "article",
  "main",
  '[role="main"]',
  ".content",
  ".documentation",
  ".markdown-body",
  ".post-content",
  ".article-content",
  ".entry-content",
  ".main-content",
  "#main",
  ".docs",
  ".readme",
  '[class*="content"]',
  '[class*="main"]'
];
const EXCLUDE_KEYWORDS = ["ad-", "advertisement", "cookie-banner", "comment-section", "social-share"];
const SKIP_TAGS = /* @__PURE__ */ new Set(["SCRIPT", "STYLE", "NOSCRIPT", "SVG", "INPUT", "TEXTAREA", "SELECT", "BUTTON", "BR", "HR"]);
const MIN_TEXT_LENGTH = 3;
class DOMScanner {
  /**
   * 扫描页面 DOM，生成 TranslationUnit 列表
   * @param root - 可选根元素，不传则自动定位主内容区
   */
  scan(root) {
    const container = root ?? this.findMainContent();
    const units = [];
    this.walk(container, units, null);
    return units;
  }
  /**
   * 定位主内容区：按优先选择器查找，未找到则回退 body 并排除非内容区
   */
  findMainContent() {
    for (const sel of MAIN_SELECTORS) {
      const el = document.querySelector(sel);
      if (el instanceof HTMLElement) return el;
    }
    return document.body;
  }
  /**
   * 递归遍历 DOM 树，对符合条件的节点生成 TranslationUnit
   * @param el - 当前元素
   * @param units - 收集结果
   * @param parentHeading - 向上找到的最近标题文本
   */
  walk(el, units, parentHeading) {
    if (this.shouldSkip(el)) return;
    const tag = el.tagName.toUpperCase();
    const unitType = this.getElementType(tag, el);
    if (unitType !== null) {
      const text = this.extractText(el);
      if (this.isValidText(text)) {
        const heading = unitType === "heading" ? text : this.findNearestHeading(el);
        const contextChain = heading ? [heading] : [];
        units.push(this.buildUnit(el, unitType, text, contextChain));
        el.setAttribute("data-dt-processed", "true");
      }
    }
    const headingForChildren = unitType === "heading" ? this.extractText(el) : parentHeading;
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
  shouldSkip(el) {
    if (el.hasAttribute("data-dt-processed")) return true;
    if (SKIP_TAGS.has(el.tagName.toUpperCase())) return true;
    if (!this.isVisible(el)) return true;
    const classAndId = (el.className + " " + el.id).toLowerCase();
    if (EXCLUDE_KEYWORDS.some((kw) => classAndId.includes(kw))) return true;
    return false;
  }
  /**
   * 检查元素是否可见
   */
  isVisible(el) {
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;
    if (parseFloat(style.opacity) === 0) return false;
    return true;
  }
  /**
   * 根据标签和 DOM 位置判断翻译单元类型
   * 扩大扫描范围：span(a), section, blockquote, dd, dt 等
   */
  getElementType(tag, el) {
    switch (tag) {
      case "H1":
      case "H2":
      case "H3":
      case "H4":
      case "H5":
      case "H6":
        return "heading";
      case "P":
        return "paragraph";
      case "LI":
        return "list_item";
      case "TD":
      case "TH":
        return "table_cell";
      case "FIGCAPTION":
        return "caption";
      case "SECTION":
        return "paragraph";
      case "BLOCKQUOTE":
        return "paragraph";
      case "DD":
      case "DT":
        return "list_item";
      case "A": {
        if (el.closest("nav")) return null;
        const href = el.getAttribute("href") ?? "";
        if (href.startsWith("#") && href.length <= 10) return null;
        const text = this.extractText(el);
        if (text.length > 10) return "paragraph";
        return null;
      }
      case "SPAN": {
        const parent = el.parentElement;
        if (parent) {
          const pTag = parent.tagName.toUpperCase();
          if (pTag === "P" || pTag === "DIV" || pTag === "LI" || pTag === "TD" || pTag === "TH") return null;
        }
        const text = this.extractText(el);
        if (text.length > 30) return "paragraph";
        return null;
      }
      default: {
        if (tag === "PRE") {
          const codeChild = el.querySelector("code");
          return codeChild ? "code_block" : null;
        }
        if (tag === "DIV" && this.containsTextNode(el)) {
          return "paragraph";
        }
        if (el.classList.contains("caption")) {
          return "caption";
        }
        return null;
      }
    }
  }
  /**
   * 提取元素纯文本，排除 script/style 子节点
   */
  extractText(el) {
    const clone = el.cloneNode(true);
    clone.querySelectorAll("script, style").forEach((n) => n.remove());
    return (clone.textContent ?? "").replace(/\s+/g, " ").trim();
  }
  /**
   * 验证文本是否有效：非空、长度足够、非纯数字/符号
   */
  isValidText(text) {
    if (text.length < MIN_TEXT_LENGTH) return false;
    if (/^[\d\s.,;:!?@#$%^&*()_+\-=[\]{}|/\\<>~`'"\u00A0-\u00FF]+$/.test(text)) return false;
    return true;
  }
  /**
   * 向上查找最近的 h1-h6 标题文本
   */
  findNearestHeading(el) {
    let current = el.parentElement;
    while (current) {
      const tag = current.tagName.toUpperCase();
      if (/^H[1-6]$/.test(tag)) {
        return (current.textContent ?? "").trim();
      }
      current = current.parentElement;
    }
    return null;
  }
  /**
   * 检查 div 元素内部是否包含纯文本节点
   */
  containsTextNode(el) {
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
  buildUnit(el, type, text, contextChain) {
    return {
      id: "u_" + Math.random().toString(36).substring(2, 11),
      type,
      element: el,
      originalText: text,
      htmlContext: el.innerHTML.trim(),
      contextChain,
      isInShadowDOM: el.getRootNode() instanceof ShadowRoot,
      isInIframe: window.self !== window.top,
      // 视口内优先级更高
      priority: el.getBoundingClientRect().top < window.innerHeight ? 10 : 5
    };
  }
}
const CONTEXT_PREVIEW_LENGTH = 50;
const BATCH_SIZE = 10;
class UnitBuilder {
  /**
   * 接收 DOMScanner 产出的 TranslationUnit[]，进行上下文增强、过滤、排序和分批
   * @returns 按批次分组的 TranslationUnit[][]
   */
  build(units) {
    const filtered = units.filter((u) => {
      if (u.originalText.trim().length === 0) return false;
      if (u.element.hasAttribute("data-dt-translated")) return false;
      return true;
    });
    filtered.sort((a, b) => b.priority - a.priority);
    for (const unit of filtered) {
      unit.contextChain = this.buildContextChain(unit, filtered);
    }
    return this.groupIntoBatches(filtered);
  }
  /**
   * 构建上下文链：[章节标题, 前文摘要1, 前文摘要2]
   */
  buildContextChain(unit, allUnits) {
    const chain = [];
    const heading = this.findHeadingForUnit(unit);
    if (heading) {
      chain.push(heading);
    }
    const siblingContexts = this.getSiblingContexts(unit, allUnits);
    for (const ctx of siblingContexts) {
      chain.push(this.truncate(ctx, CONTEXT_PREVIEW_LENGTH));
    }
    return chain;
  }
  /**
   * 向上查找单元对应的最近标题
   */
  findHeadingForUnit(unit) {
    let el = unit.element.parentElement;
    while (el) {
      if (/^H[1-6]$/.test(el.tagName)) {
        return (el.textContent ?? "").replace(/\s+/g, " ").trim();
      }
      el = el.parentElement;
    }
    return null;
  }
  /**
   * 获取同父元素下该单元之前的最近两个相邻单元的 originalText
   */
  getSiblingContexts(unit, allUnits) {
    const parent = unit.element.parentElement;
    if (!parent) return [];
    const siblings = allUnits.filter(
      (u) => u.element.parentElement === parent && u.id !== unit.id
    );
    const children = Array.from(parent.children);
    const currentIndex = children.indexOf(unit.element);
    if (currentIndex === -1) return [];
    const beforeSiblings = siblings.filter((u) => {
      const idx = children.indexOf(u.element);
      return idx !== -1 && idx < currentIndex;
    });
    beforeSiblings.sort((a, b) => {
      return children.indexOf(b.element) - children.indexOf(a.element);
    });
    return beforeSiblings.slice(0, 2).map((u) => u.originalText);
  }
  /**
   * 截断文本到指定长度
   */
  truncate(text, maxLen) {
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen) + "...";
  }
  /**
   * 按批次分组：同 heading 的单元尽量同批次，每批不超过 BATCH_SIZE
   * 使用 heading + 元素位置作为分组键，避免同名标题（如 "Overview"）被合并
   */
  groupIntoBatches(units) {
    if (units.length === 0) return [];
    const batches = [];
    let currentBatch = [];
    let currentHeading = "";
    for (const unit of units) {
      const heading = unit.contextChain[0] ?? "";
      if (heading !== currentHeading && currentBatch.length > 0) {
        batches.push(currentBatch);
        currentBatch = [];
      }
      currentHeading = heading;
      currentBatch.push(unit);
      if (currentBatch.length >= BATCH_SIZE) {
        batches.push(currentBatch);
        currentBatch = [];
      }
    }
    if (currentBatch.length > 0) {
      batches.push(currentBatch);
    }
    return batches;
  }
}
const BATCH_DELAY_MS = 300;
const MESSAGE_TIMEOUT_MS = 8e3;
class TranslationQueue {
  constructor(callbacks) {
    this.isRunning = false;
    this.onProgress = callbacks.onProgress;
    this.onComplete = callbacks.onComplete;
    this.onError = callbacks.onError;
  }
  /**
   * 启动翻译：逐批次发送、等待结果、上报进度
   * 检测到扩展上下文失效后立即中止，避免无效等待
   */
  async start(batches) {
    if (this.isRunning) return;
    this.isRunning = true;
    try {
      const allResults = [];
      let totalUnits = 0;
      for (const batch of batches) totalUnits += batch.length;
      let translatedCount = 0;
      for (let i = 0; i < batches.length; i++) {
        if (!chrome.runtime?.id) {
          console.error("[DocBridge] 扩展上下文已失效，停止翻译队列");
          this.onError?.(new Error("扩展上下文已失效，请刷新页面后重试"));
          break;
        }
        const batch = batches[i];
        try {
          console.log(`[DocBridge] 发送翻译请求，批次 ${i + 1}/${batches.length}`);
          const cached = [];
          const uncached = [];
          for (const unit of batch) {
            const hash = await hashText(unit.originalText);
            const cacheRsp = await this.sendMessage({
              type: "GET_CACHE",
              payload: { originalHash: hash }
            });
            if (cacheRsp?.translatedText) {
              cached.push({ id: unit.id, translatedText: cacheRsp.translatedText });
            } else {
              uncached.push(unit);
            }
          }
          if (uncached.length > 0) {
            const response = await this.sendMessage({
              type: "TRANSLATE",
              payload: {
                units: uncached.map((u) => ({
                  id: u.id,
                  text: u.originalText,
                  contextChain: u.contextChain
                })),
                glossary: {},
                targetLang: "zh-CN"
              }
            });
            if (!response || !response.success) {
              throw new Error(response?.error ?? "翻译失败");
            }
            const translated = response.data ?? [];
            if (translated.length === 0) {
              console.warn(`[DocBridge] 批次 ${i + 1}: API 返回 0 条翻译结果`);
            } else {
              console.log(`[DocBridge] 批次 ${i + 1} 收到翻译结果:`, translated.length, "条");
            }
            cached.push(...translated);
          }
          for (const r of cached) {
            const original = batch.find((u) => u.id === r.id);
            if (original) {
              allResults.push({
                id: r.id,
                translatedText: r.translatedText,
                originalUnit: original
              });
            }
          }
          translatedCount += cached.length;
          this.onProgress(translatedCount, totalUnits);
          if (i < batches.length - 1) {
            await sleep(BATCH_DELAY_MS);
          }
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          if (error.message.includes("Extension context invalidated") || error.message.includes("扩展上下文已失效")) {
            console.error(`[DocBridge] 翻译批次 ${i + 1} 失败 (上下文中止):`, error.message);
            this.onError?.(error);
            break;
          }
          console.error(`[DocBridge] 翻译批次 ${i + 1} 失败:`, error.message);
          this.onError?.(error);
        }
      }
      this.onComplete(allResults);
    } finally {
      this.isRunning = false;
    }
  }
  /** 销毁队列 */
  destroy() {
    return;
  }
  /**
   * 发送消息给 Service Worker，带超时保护
   * 超时或扩展上下文失效时抛出明确错误，避免 Promise 永久挂起
   */
  sendMessage(message) {
    return new Promise((resolve, reject) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        const msg = `消息 ${message.type} 超时 (${MESSAGE_TIMEOUT_MS}ms)，Service Worker 可能未启动`;
        console.error(`[DocBridge] ${msg}`);
        reject(new Error(msg));
      }, MESSAGE_TIMEOUT_MS);
      chrome.runtime.sendMessage(message, (response) => {
        clearTimeout(timer);
        if (settled) return;
        settled = true;
        if (chrome.runtime.lastError) {
          console.error(`[DocBridge] ${message.type} 失败:`, chrome.runtime.lastError.message);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
    });
  }
}
async function hashText(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
const DT_BRIDGE_CLASS = "dt-bridge";
const DT_LABEL_CLASS = "dt-label";
const DT_TEXT_CLASS = "dt-text";
const DT_ID_ATTR = "data-dt-id";
const MODE_CLASS_MAP = {
  "bilingual": "dt-mode-bilingual",
  "translated-only": "dt-mode-translated-only",
  "original-only": "dt-mode-original-only"
};
const STYLE_ID = "docbridge-renderer-styles";
class DOMRenderer {
  constructor() {
    this.currentMode = "bilingual";
    this.injectStyles();
    this.setMode(this.currentMode);
  }
  /**
   * 渲染译文：在每个单元元素内部末尾插入 dt-bridge 节点
   */
  render(units) {
    console.log("[DocBridge] DOMRenderer.render 收到", units.length, "个译文单元");
    let skipped = 0;
    let rendered = 0;
    for (const unit of units) {
      try {
        const result = this.renderOne(unit);
        if (result === "skipped") skipped++;
        else if (result === "rendered") rendered++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[DocBridge] 渲染单元 ${unit.id} 失败:`, msg);
      }
    }
    console.log(`[DocBridge] 渲染完成: ${rendered} 个已渲染, ${skipped} 个跳过`);
  }
  /**
   * 切换显示模式（通过 body class，不操作 DOM 元素）
   */
  setMode(mode) {
    for (const cls of Object.values(MODE_CLASS_MAP)) {
      document.body.classList.remove(cls);
    }
    document.body.classList.add(MODE_CLASS_MAP[mode]);
    this.currentMode = mode;
  }
  /**
   * 获取当前显示模式
   */
  getMode() {
    return this.currentMode;
  }
  /**
   * 清除所有译文节点和标记（包括 scanner 的 data-dt-processed，确保可重新翻译）
   */
  clear() {
    document.querySelectorAll(`.${DT_BRIDGE_CLASS}`).forEach((el) => el.remove());
    document.querySelectorAll("[data-dt-translated]").forEach((el) => {
      el.removeAttribute("data-dt-translated");
    });
    document.querySelectorAll("[data-dt-processed]").forEach((el) => {
      el.removeAttribute("data-dt-processed");
    });
    const tooltip = document.getElementById("dt-tooltip");
    if (tooltip) tooltip.style.display = "none";
    for (const cls of Object.values(MODE_CLASS_MAP)) {
      document.body.classList.remove(cls);
    }
  }
  // ---------- 私有方法 ----------
  /**
   * 渲染单个译文单元，返回 'rendered' | 'skipped' 用于统计
   */
  renderOne(unit) {
    if (!unit.originalUnit) {
      console.warn(`[DocBridge] 跳过 ${unit.id}: originalUnit 为 null (SW 无 DOM)`);
      return "skipped";
    }
    const el = unit.originalUnit.element;
    if (!el) {
      console.warn(`[DocBridge] 跳过 ${unit.id}: element 引用为空`);
      return "skipped";
    }
    if (!document.contains(el)) {
      console.warn(`[DocBridge] 跳过 ${unit.id}: 元素已脱离 DOM`);
      return "skipped";
    }
    if (el.hasAttribute("data-dt-translated")) {
      return "skipped";
    }
    const wrapper = this.buildBridge(unit);
    el.appendChild(wrapper);
    el.setAttribute("data-dt-translated", "true");
    return "rendered";
  }
  /**
   * 构建 dt-bridge 译文节点（含 tooltip 事件 + 自动换行样式）
   */
  buildBridge(unit) {
    const wrapper = document.createElement("span");
    wrapper.className = DT_BRIDGE_CLASS;
    wrapper.setAttribute(DT_ID_ATTR, unit.id);
    wrapper.style.cssText = [
      "display:block",
      "margin-top:4px",
      "padding:4px 0",
      "border-left:3px solid #1890ff",
      "padding-left:8px",
      "white-space:normal",
      "word-break:break-word",
      "overflow-wrap:break-word",
      "position:relative",
      "z-index:1"
    ].join(";");
    if (unit.originalUnit?.type === "code_block") {
      wrapper.style.fontFamily = "monospace";
      wrapper.style.backgroundColor = "#f6f8fa";
      wrapper.style.borderRadius = "4px";
    }
    const label = document.createElement("span");
    label.className = DT_LABEL_CLASS;
    label.style.cssText = "color:#999;font-size:0.85em;margin-right:4px;";
    label.textContent = "[译]";
    const text = document.createElement("span");
    text.className = DT_TEXT_CLASS;
    text.style.cssText = "color:#333;";
    text.textContent = unit.translatedText;
    wrapper.appendChild(label);
    wrapper.appendChild(text);
    this.bindTooltip(wrapper, unit.translatedText);
    return wrapper;
  }
  /**
   * 绑定 tooltip：mouseenter 显示完整译文，mouseleave 隐藏
   */
  bindTooltip(el, fullText) {
    el.addEventListener("mouseenter", (e) => {
      const tooltip = this.ensureTooltip();
      tooltip.textContent = fullText;
      tooltip.style.display = "block";
      this.positionTooltip(tooltip, e);
    });
    el.addEventListener("mousemove", (e) => {
      const tooltip = document.getElementById("dt-tooltip");
      if (tooltip && tooltip.style.display !== "none") {
        this.positionTooltip(tooltip, e);
      }
    });
    el.addEventListener("mouseleave", () => {
      const tooltip = document.getElementById("dt-tooltip");
      if (tooltip) tooltip.style.display = "none";
    });
  }
  /**
   * 确保全局 tooltip 元素存在
   */
  ensureTooltip() {
    const existing = document.getElementById("dt-tooltip");
    if (existing) return existing;
    const tooltip = document.createElement("div");
    tooltip.id = "dt-tooltip";
    tooltip.style.cssText = [
      "position:fixed",
      "display:none",
      "background:rgba(0,0,0,0.9)",
      "color:#fff",
      "padding:8px 12px",
      "border-radius:4px",
      "font-size:13px",
      "max-width:400px",
      "z-index:99999",
      "line-height:1.5",
      "pointer-events:none",
      "white-space:normal",
      "word-break:break-word"
    ].join(";");
    document.body.appendChild(tooltip);
    return tooltip;
  }
  /**
   * 定位 tooltip 到鼠标上方 8px
   */
  positionTooltip(tooltip, e) {
    const offsetX = 12;
    const offsetY = 8;
    let left = e.clientX + offsetX;
    let top = e.clientY - tooltip.offsetHeight - offsetY;
    if (left + tooltip.offsetWidth > window.innerWidth - 8) {
      left = window.innerWidth - tooltip.offsetWidth - 8;
    }
    if (top < 8) {
      top = e.clientY + offsetY;
    }
    if (left < 8) left = 8;
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }
  /**
   * 注入显示模式控制的 CSS 样式
   */
  injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
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
let renderer = null;
let observer = null;
let lastUrl = location.href;
let translateTimer = null;
let isTranslating = false;
(function init() {
  const startDelay = 500;
  if (document.readyState === "complete") {
    setTimeout(() => translatePage(), startDelay);
  } else {
    window.addEventListener("load", () => setTimeout(() => translatePage(), startDelay));
  }
  setupMessageListener();
  setupMutationObserver();
  injectFloatingBar();
})();
async function translatePage() {
  if (isTranslating) return;
  isTranslating = true;
  try {
    renderer?.clear();
    const scanner = new DOMScanner();
    const units = scanner.scan();
    const builder = new UnitBuilder();
    const batches = builder.build(units);
    if (batches.length === 0) {
      console.log("[DocBridge] 无可翻译内容");
      isTranslating = false;
      return;
    }
    if (!renderer) {
      renderer = new DOMRenderer();
    }
    const unitCount = batches.reduce((sum, b) => sum + b.length, 0);
    console.log(`[DocBridge] 扫描到 ${unitCount} 个翻译单元，${batches.length} 个批次`);
    disconnectObserver();
    const queue = new TranslationQueue({
      onProgress: (done, total) => {
        console.log(`[DocBridge] 翻译进度: ${done}/${total}`);
      },
      onComplete: (results) => {
        console.log(`[DocBridge] onComplete: ${results.length} 个结果 → 传入 renderer`);
        if (results.length > 0) {
          const sample = results[0];
          console.log("[DocBridge] 首个结果:", sample.id, "译文:", sample.translatedText?.slice(0, 50), "originalUnit:", sample.originalUnit ? "存在" : "NULL");
        }
        if (renderer) renderer.render(results);
        console.log(`[DocBridge] 翻译完成: ${results.length} 个单元已渲染`);
        isTranslating = false;
        connectObserver();
      },
      onError: (err) => {
        console.error("[DocBridge] 翻译错误:", err.message);
      }
    });
    await queue.start(batches);
    queue.destroy();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[DocBridge] 翻译流程异常:", msg);
    isTranslating = false;
    connectObserver();
  }
}
function setupMutationObserver() {
  observer = new MutationObserver(() => {
    if (translateTimer) clearTimeout(translateTimer);
    translateTimer = setTimeout(() => {
      const currentUrl = location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        if (renderer) renderer.clear();
        translatePage();
        return;
      }
      const unprocessed = document.querySelectorAll(
        "p:not([data-dt-processed]), h1:not([data-dt-processed]), h2:not([data-dt-processed]), h3:not([data-dt-processed]), li:not([data-dt-processed]), td:not([data-dt-processed])"
      );
      if (unprocessed.length > 5) {
        translatePage();
      }
    }, 1e3);
  });
  connectObserver();
}
function connectObserver() {
  if (observer) {
    observer.observe(document.body, { childList: true, subtree: true });
  }
}
function disconnectObserver() {
  if (observer) {
    observer.disconnect();
  }
}
function setupMessageListener() {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    try {
      switch (message.type) {
        case "TOGGLE_DISPLAY": {
          const { mode } = message.payload;
          if (renderer) {
            renderer.setMode(mode);
          }
          sendResponse({ success: true });
          break;
        }
        case "START_TRANSLATE": {
          translatePage();
          sendResponse({ success: true });
          break;
        }
        default:
          break;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[DocBridge] 消息处理异常:", msg);
      sendResponse({ error: msg });
    }
    return true;
  });
}
function injectFloatingBar() {
  const bar = document.createElement("div");
  bar.id = "docbridge-floating-bar";
  bar.style.cssText = [
    "position:fixed",
    "bottom:20px",
    "right:20px",
    "z-index:2147483647",
    "display:flex",
    "gap:6px",
    "padding:8px 12px",
    "background:rgba(255,255,255,0.95)",
    "border:1px solid #d9d9d9",
    "border-radius:8px",
    "box-shadow:0 2px 12px rgba(0,0,0,0.12)",
    "font-family:sans-serif",
    "font-size:13px"
  ].join(";");
  bar.appendChild(createBtn("翻译", () => {
    renderer?.clear();
    translatePage();
  }, "#1890ff", "#fff"));
  bar.appendChild(createBtn("还原", () => renderer?.clear(), "#595959", "#fff"));
  const sep = document.createElement("span");
  sep.style.cssText = "color:#d9d9d9;line-height:28px;";
  sep.textContent = "|";
  bar.appendChild(sep);
  bar.appendChild(createBtn("双语", () => renderer?.setMode("bilingual"), "#52c41a", "#fff"));
  bar.appendChild(createBtn("仅译文", () => renderer?.setMode("translated-only"), "#faad14", "#fff"));
  bar.appendChild(createBtn("仅原文", () => renderer?.setMode("original-only"), "#d9d9d9", "#333"));
  document.body.appendChild(bar);
}
function createBtn(text, onClick, bgColor, color) {
  const btn = document.createElement("button");
  btn.textContent = text;
  btn.style.cssText = [
    "padding:4px 10px",
    `background:${bgColor}`,
    `color:${color}`,
    "border:none",
    "border-radius:4px",
    "cursor:pointer",
    "font-size:12px",
    "line-height:20px",
    "white-space:nowrap"
  ].join(";");
  btn.addEventListener("click", onClick);
  return btn;
}
//# sourceMappingURL=index.js.map
