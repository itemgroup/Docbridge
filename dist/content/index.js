const MAIN_SELECTORS = [
  "article",
  "main",
  '[role="main"]',
  ".content",
  "#content",
  ".main",
  ".documentation",
  ".markdown-body",
  ".post-content",
  ".article-content",
  ".entry-content",
  ".main-content",
  "#main",
  ".docs",
  ".readme"
];
const EXCLUDE_KEYWORDS = ["ad-", "advertisement", "cookie-banner", "comment-section", "social-share"];
const BLOCK_CHILD_SELECTORS = "p, div, li, h1, h2, h3, h4, h5, h6, td, th, pre, blockquote, section, article, aside, figcaption, dd, dt, ul, ol, table";
const SKIP_TAGS = /* @__PURE__ */ new Set(["SCRIPT", "STYLE", "NOSCRIPT", "SVG", "INPUT", "TEXTAREA", "SELECT", "BUTTON", "BR", "HR", "CODE"]);
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
      const text = unitType === "code_block" ? this.extractCodeComments(el) : this.extractText(el);
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
    if (el.hasAttribute("data-dt-translated")) return true;
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
      case "ARTICLE":
      case "ASIDE":
        if (el.querySelector(BLOCK_CHILD_SELECTORS)) return null;
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
          return "code_block";
        }
        if (tag === "DIV" && this.containsTextNode(el) && !el.querySelector(BLOCK_CHILD_SELECTORS)) {
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
   * 提取代码块中的注释行, 代码逻辑不翻译
   */
  extractCodeComments(el) {
    const code = el.textContent ?? "";
    const lines = code.split("\n");
    const comments = [];
    let inBlockComment = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (inBlockComment) {
        comments.push(line);
        if (trimmed.includes("*/")) inBlockComment = false;
        continue;
      }
      if (trimmed.startsWith("#")) {
        comments.push(line);
      } else if (trimmed.startsWith("//")) {
        comments.push(line);
      } else if (trimmed.startsWith("/*") || trimmed.includes("/*")) {
        comments.push(line);
        if (!trimmed.includes("*/")) inBlockComment = true;
      } else if (trimmed.startsWith("*") && !trimmed.startsWith("**/")) {
        comments.push(line);
      }
    }
    return comments.join("\n");
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
const BATCH_SIZE = 20;
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
const BATCH_DELAY_MS = 100;
const CONCURRENT_BATCHES = 1;
const MESSAGE_TIMEOUT_MS = 3e4;
class TranslationQueue {
  constructor(callbacks) {
    this.isRunning = false;
    this.onProgress = callbacks.onProgress;
    this.onComplete = callbacks.onComplete;
    this.onError = callbacks.onError;
  }
  /**
   * 启动翻译：并发发送 3 个批次，等待结果、上报进度
   * 检测到扩展上下文失效后立即中止
   */
  async start(batches) {
    if (this.isRunning) return;
    this.isRunning = true;
    try {
      const allResults = [];
      let totalUnits = 0;
      for (const batch of batches) totalUnits += batch.length;
      let translatedCount = 0;
      for (let i = 0; i < batches.length; i += CONCURRENT_BATCHES) {
        if (!chrome.runtime?.id) {
          console.error("[DocBridge] 扩展上下文已失效，停止翻译队列");
          this.onError?.(new Error("扩展上下文已失效，请刷新页面后重试"));
          break;
        }
        const chunk = batches.slice(i, i + CONCURRENT_BATCHES);
        const startIndex = i;
        console.log(`[DocBridge] 并发翻译 批次 ${startIndex + 1}-${Math.min(startIndex + CONCURRENT_BATCHES, batches.length)}/${batches.length}`);
        const chunkResults = await Promise.allSettled(
          chunk.map((batch, j) => this.processBatch(batch, startIndex + j))
        );
        for (const result of chunkResults) {
          if (result.status === "fulfilled") {
            for (const r of result.value) {
              const original = batches.flat().find((u) => u.id === r.id);
              if (original) {
                allResults.push({
                  id: r.id,
                  translatedText: r.translatedText,
                  originalUnit: original
                });
              }
            }
            translatedCount += result.value.length;
          }
        }
        this.onProgress(translatedCount, totalUnits);
        if (i + CONCURRENT_BATCHES < batches.length) {
          await sleep(BATCH_DELAY_MS);
        }
      }
      this.onComplete(allResults);
    } finally {
      this.isRunning = false;
    }
  }
  /**
   * 处理单个批次的翻译流程
   * 缓存由 background SW 的 TRANSLATE handler 内部处理，不单独逐条查询
   */
  async processBatch(batch, batchIndex) {
    try {
      const response = await this.sendMessage({
        type: "TRANSLATE",
        payload: {
          units: batch.map((u) => ({
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
        console.warn(`[DocBridge] 批次 ${batchIndex + 1}: API 返回 0 条翻译结果`);
      } else {
        console.log(`[DocBridge] 批次 ${batchIndex + 1} 收到翻译结果:`, translated.length, "条");
      }
      return translated;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      if (error.message.includes("Extension context invalidated") || error.message.includes("扩展上下文已失效")) {
        console.error(`[DocBridge] 翻译批次 ${batchIndex + 1} 失败 (上下文中止):`, error.message);
        this.onError?.(error);
        return [];
      }
      console.error(`[DocBridge] 翻译批次 ${batchIndex + 1} 失败:`, error.message);
      this.onError?.(error);
      return [];
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
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
const MODE_PREFIX = "dt-mode";
const STYLE_ID = "docbridge-renderer-styles";
class DOMRenderer {
  constructor() {
    this.currentMode = "bilingual";
    this.injectStyles();
  }
  // ======================== 公开 API ========================
  /**
   * 渲染译文：包裹直接文本节点便于 CSS 控制 + 追加 .dt-bridge 到尾
   * 不动任何子元素，不修改任何文本节点内容
   */
  render(units) {
    let rendered = 0;
    for (const unit of units) {
      try {
        if (this.renderOne(unit)) rendered++;
      } catch (err) {
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
  setMode(mode) {
    this.currentMode = mode;
    document.body.classList.remove(
      `${MODE_PREFIX}-bilingual`,
      `${MODE_PREFIX}-translated-only`,
      `${MODE_PREFIX}-original-only`
    );
    document.body.classList.add(`${MODE_PREFIX}-${mode}`);
  }
  getMode() {
    return this.currentMode;
  }
  /**
   * 清除所有：解包 .dt-text-node → 移除 .dt-bridge → 清除属性
   * 完全恢复到翻译前的 DOM 结构
   */
  clear() {
    document.querySelectorAll("[data-dt-translated]").forEach((el) => {
      const htmlEl = el;
      const wrappers = htmlEl.querySelectorAll(".dt-text-node");
      for (let i = wrappers.length - 1; i >= 0; i--) {
        const wrapper = wrappers[i];
        while (wrapper.firstChild) {
          wrapper.parentNode.insertBefore(wrapper.firstChild, wrapper);
        }
        wrapper.remove();
      }
      const bridge = htmlEl.querySelector(".dt-bridge");
      if (bridge) bridge.remove();
      htmlEl.removeAttribute("data-dt-translated");
      htmlEl.removeAttribute("data-dt-id");
      htmlEl.removeAttribute("data-dt-original-text");
      htmlEl.removeAttribute("data-dt-translated-text");
    });
    document.querySelectorAll("[data-dt-processed]").forEach((el) => {
      el.removeAttribute("data-dt-processed");
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
  exportHTML() {
    try {
      const clone = document.documentElement.cloneNode(true);
      clone.querySelectorAll("[data-dt-translated]").forEach((el) => {
        const htmlEl = el;
        const bridge = htmlEl.querySelector(".dt-bridge");
        if (bridge) bridge.remove();
        const transText = htmlEl.getAttribute("data-dt-translated-text");
        if (transText) {
          htmlEl.textContent = transText;
        }
        htmlEl.removeAttribute("data-dt-translated");
        htmlEl.removeAttribute("data-dt-id");
        htmlEl.removeAttribute("data-dt-original-text");
        htmlEl.removeAttribute("data-dt-translated-text");
      });
      clone.querySelectorAll("[data-dt-processed]").forEach((el) => {
        el.removeAttribute("data-dt-processed");
      });
      const bar = clone.querySelector("#docbridge-floating-bar");
      if (bar) bar.remove();
      const html = "<!DOCTYPE html>\n" + clone.outerHTML;
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = document.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, "_").slice(0, 80);
      a.download = `translated-${safeName || "page"}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5e3);
      console.log("[DocBridge] 页面已导出");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[DocBridge] 导出失败:", msg);
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
  renderOne(unit) {
    if (!unit.originalUnit) return false;
    const el = unit.originalUnit.element;
    if (!el || !document.contains(el)) return false;
    if (el.hasAttribute("data-dt-translated")) return false;
    if (el.querySelector("[data-dt-translated]")) return false;
    if (el.querySelector(".dt-bridge")) return false;
    if (unit.originalUnit.type === "code_block") {
      return this.markOnly(el, unit);
    }
    for (const child of Array.from(el.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        const wrapper = document.createElement("span");
        wrapper.className = "dt-text-node";
        wrapper.style.cssText = "";
        el.insertBefore(wrapper, child);
        wrapper.appendChild(child);
      }
    }
    el.setAttribute("data-dt-original-text", el.textContent || "");
    el.setAttribute("data-dt-translated-text", unit.translatedText);
    const bridge = document.createElement("span");
    bridge.className = "dt-bridge";
    bridge.setAttribute("data-dt-id", unit.id);
    bridge.textContent = unit.translatedText;
    bridge.title = unit.translatedText;
    el.appendChild(bridge);
    el.setAttribute("data-dt-translated", "true");
    el.setAttribute("data-dt-id", unit.id);
    return true;
  }
  /**
   * 仅标记（代码块）：不修改任何 DOM 内容
   */
  markOnly(el, unit) {
    el.setAttribute("data-dt-translated", "true");
    el.setAttribute("data-dt-id", unit.id);
    return true;
  }
  // ======================== 私有：样式注入 ========================
  injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
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
let renderer = null;
let observer = null;
let lastUrl = location.href;
let translateTimer = null;
let isTranslating = false;
let isRestoring = false;
(function init() {
  setupMessageListener();
  setupMutationObserver();
  ensureFloatingBar();
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
        setTimeout(connectObserver, 500);
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
    if (isRestoring) return;
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
        "p:not([data-dt-processed]):not([data-dt-translated]), h1:not([data-dt-processed]):not([data-dt-translated]), h2:not([data-dt-processed]):not([data-dt-translated]), h3:not([data-dt-processed]):not([data-dt-translated]), li:not([data-dt-processed]):not([data-dt-translated]), td:not([data-dt-processed]):not([data-dt-translated])"
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
          const mode = message.payload;
          if (renderer) {
            disconnectObserver();
            if (translateTimer) {
              clearTimeout(translateTimer);
              translateTimer = null;
            }
            isRestoring = true;
            renderer.setMode(mode);
            setTimeout(() => {
              isRestoring = false;
              connectObserver();
            }, 300);
          }
          sendResponse({ success: true });
          break;
        }
        case "START_TRANSLATE": {
          disconnectObserver();
          renderer?.clear();
          translatePage();
          sendResponse({ success: true });
          break;
        }
        case "EXPORT_HTML": {
          if (renderer) {
            renderer.exportHTML();
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false, error: "渲染器未初始化" });
          }
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
function ensureFloatingBar() {
  if (document.getElementById("docbridge-floating-bar")) return;
  injectFloatingBar();
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
  function safeAction(action, reconnectDelay = 300) {
    disconnectObserver();
    if (translateTimer) {
      clearTimeout(translateTimer);
      translateTimer = null;
    }
    isRestoring = true;
    action();
    setTimeout(() => {
      isRestoring = false;
      connectObserver();
    }, reconnectDelay);
  }
  bar.appendChild(createBtn("还原", () => {
    safeAction(() => {
      renderer?.clear();
    }, 300);
  }, "#595959", "#fff"));
  bar.appendChild(createSep());
  bar.appendChild(createBtn("双语", () => {
    safeAction(() => {
      renderer?.setMode("bilingual");
    }, 200);
  }, "#52c41a", "#fff"));
  bar.appendChild(createBtn("仅译文", () => {
    safeAction(() => {
      renderer?.setMode("translated-only");
    }, 200);
  }, "#faad14", "#fff"));
  bar.appendChild(createBtn("仅原文", () => {
    safeAction(() => {
      renderer?.setMode("original-only");
    }, 200);
  }, "#d9d9d9", "#333"));
  bar.appendChild(createSep());
  bar.appendChild(createBtn("导出", () => {
    renderer?.exportHTML();
  }, "#722ed1", "#fff"));
  document.body.appendChild(bar);
}
function createSep() {
  const sep = document.createElement("span");
  sep.style.cssText = "color:#d9d9d9;line-height:28px;";
  sep.textContent = "|";
  return sep;
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
