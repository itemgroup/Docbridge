// Content Script 入口 | 页面翻译全流程组装 + SPA 增量翻译
import type { DTMessage, DisplayMode, TranslatedUnit, TranslationUnit } from '../shared/types';
import { scanPage } from './scanner/dom-scanner';
import { buildBatches } from './analyzer/unit-builder';
import { TranslationQueue } from './translator/translation-queue';
import { renderTranslation, applyDisplayMode, clearTranslation, exportHTML, injectGlobalStyles } from './renderer/dom-renderer';
import { DOM_DEBOUNCE_MS } from '../shared/constants';

/** 当前显示模式 */
let currentMode: DisplayMode = 'bilingual';

/** 翻译是否进行中 */
let isTranslating = false;

/** 页面是否被锁定 */
let isLocked = false;

/** 已翻译结果缓存 */
let translatedResults: TranslatedUnit[] = [];

/** 翻译队列实例 */
const queue = new TranslationQueue();

/** MutationObserver 实例 */
let observer: MutationObserver | null = null;

/** 防抖定时器 */
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/** 增量扫描新增节点收集 */
let pendingNewNodes: HTMLElement[] = [];

/**
 * 注入全局样式和浮动控制栏
 */
function initialize(): void {
  injectGlobalStyles();
  createFloatingBar();

  chrome.runtime.onMessage.addListener((message: DTMessage, _sender, sendResponse) => {
    handleMessage(message).then((result) => sendResponse(result));
    return true;
  });

  console.log('[DocBridge Content] 已初始化');
}

/**
 * 处理来自 popup/background 的消息
 */
async function handleMessage(message: DTMessage): Promise<{ success: boolean; error?: string }> {
  try {
    switch (message.type) {
      case 'START_TRANSLATE':
        // 手动点击翻译：完整正文扫描
        await translatePage();
        return { success: true };

      case 'TOGGLE_DISPLAY':
        currentMode = (message.payload as DisplayMode) || 'bilingual';
        applyDisplayMode(currentMode);
        if (currentMode !== 'original-only' && translatedResults.length > 0) {
          ensureRendered(translatedResults);
        }
        return { success: true };

      case 'CLEAR_TRANSLATION':
        clearTranslation();
        translatedResults = [];
        currentMode = 'bilingual';
        return { success: true };

      case 'EXPORT_HTML': {
        const html = exportHTML();
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `docbridge-${document.title || 'page'}.html`;
        a.click();
        URL.revokeObjectURL(url);
        return { success: true };
      }

      default:
        return { success: false, error: '未知消息类型' };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * 完整翻译流程（手动点击触发）
 * 扫描整个正文区域 → 构建批次 → 翻译 → 渲染
 */
async function translatePage(): Promise<void> {
  if (isTranslating) return;
  isTranslating = true;
  isLocked = true;

  try {
    console.log('[DocBridge] 开始完整正文扫描...');
    // scanPage() 无参 → 自动寻找 main/article
    const units = await scanPage();

    if (units.length === 0) {
      console.log('[DocBridge] 正文区域未发现需要翻译的文本');
      return;
    }

    console.log(`[DocBridge] 发现 ${units.length} 个翻译单元`);

    await processUnits(units);
  } finally {
    isTranslating = false;
    isLocked = false;
  }
}

/**
 * 处理翻译单元：构建批次 → 翻译 → 渲染
 */
async function processUnits(units: TranslationUnit[]): Promise<void> {
  const batches = buildBatches(units);
  console.log(`[DocBridge] 分为 ${batches.length} 个批次`);

  translatedResults = [];

  await new Promise<void>((resolve) => {
    queue.start(
      batches,
      (completed, total) => {
        console.log(`[DocBridge] 翻译进度: ${completed}/${total}`);
      },
      (results) => {
        translatedResults = results;
        renderTranslation(results, currentMode);
        resolve();
      },
      (error, _failedIds) => {
        console.error('[DocBridge] 翻译出错:', error);
        resolve();
      }
    );
  });

  console.log(`[DocBridge] 翻译完成，共 ${translatedResults.length} 条`);
}

/**
 * 确保译文已渲染（切换模式时使用）
 */
function ensureRendered(results: TranslatedUnit[]): void {
  for (const unit of results) {
    const el = unit.originalUnit.element;
    if (!el || !el.isConnected) continue;
    if (el.querySelector('.dt-bridge')) continue;
    renderTranslation([unit], currentMode);
  }
}

/**
 * 启动 SPA DOM 变化监听（增量扫描）
 * 不执行全页面重扫，仅对新增子树执行 TreeWalker 扫描
 */
function startMutationObserver(): void {
  if (observer) return;

  observer = new MutationObserver((mutations) => {
    // 队列运行中 → 跳过，不追加大批量新任务
    if (isLocked || isTranslating) return;

    // 收集新增的有效元素节点
    let hasNewContent = false;
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            if (el.classList.contains('dt-bridge')) continue;
            if (el.id === 'dt-floating-bar') continue;
            pendingNewNodes.push(el);
            hasNewContent = true;
          }
        }
      }
    }

    if (!hasNewContent) return;

    // 防抖：350ms 内多次 DOM 变动合并为一次
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      handleIncrementalScan();
    }, DOM_DEBOUNCE_MS);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

/**
 * 处理增量扫描：仅对新增 DOM 子树执行 TreeWalker
 */
async function handleIncrementalScan(): Promise<void> {
  if (pendingNewNodes.length === 0) return;
  if (isTranslating) return;

  // 取出待处理节点并清空
  const nodes = pendingNewNodes;
  pendingNewNodes = [];

  console.log(`[DocBridge] 检测到 ${nodes.length} 个新增节点，增量扫描...`);

  // 筛选仍在 DOM 中的节点
  const liveNodes = nodes.filter((n) => n.isConnected);
  if (liveNodes.length === 0) return;

  try {
    // 对每个新增子树独立扫描
    const allUnits: TranslationUnit[] = [];
    for (const node of liveNodes) {
      const units = await scanPage(node);
      allUnits.push(...units);
    }

    if (allUnits.length === 0) return;

    console.log(`[DocBridge] 增量发现 ${allUnits.length} 个新翻译单元`);

    // 过滤已翻译
    const newUnits = allUnits.filter(
      (u) => !u.element.hasAttribute('data-dt-translated')
    );

    if (newUnits.length === 0) return;

    await processUnits(newUnits);
  } catch (error) {
    console.error('[DocBridge] 增量扫描失败:', error);
  }
}

/**
 * 在页面右下角创建悬浮控制栏
 */
function createFloatingBar(): void {
  if (document.getElementById('dt-floating-bar')) return;

  const bar = document.createElement('div');
  bar.id = 'dt-floating-bar';
  bar.style.cssText = `
    position: fixed; bottom: 20px; right: 20px; z-index: 2147483647;
    display: flex; flex-direction: column; gap: 6px;
    background: #fff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.15);
    padding: 12px; font-family: sans-serif; font-size: 13px;
  `;

  const title = document.createElement('div');
  title.textContent = 'DocBridge';
  title.style.cssText = 'font-weight:700;text-align:center;color:#1890ff;font-size:14px;margin-bottom:4px;';
  bar.appendChild(title);

  // 翻译按钮（手动点击 → 完整正文扫描）
  const translateBtn = createButton('翻译', '#1890ff', '#fff', () => {
    translatePage();
  });
  bar.appendChild(translateBtn);

  const modes: Array<{ label: string; mode: DisplayMode }> = [
    { label: '双语', mode: 'bilingual' },
    { label: '仅译文', mode: 'translated-only' },
    { label: '原文', mode: 'original-only' },
  ];

  for (const { label, mode } of modes) {
    const btn = createButton(label, '#f0f0f0', '#333', () => {
      currentMode = mode;
      applyDisplayMode(mode);
      if (mode !== 'original-only' && translatedResults.length > 0) {
        ensureRendered(translatedResults);
      }
    });
    btn.style.cssText += 'font-size:12px;padding:5px 8px;';
    bar.appendChild(btn);
  }

  const clearBtn = createButton('还原', '#ff4d4f', '#fff', () => {
    clearTranslation();
    translatedResults = [];
    currentMode = 'bilingual';
  });
  bar.appendChild(clearBtn);

  document.body.appendChild(bar);
}

function createButton(
  text: string,
  bgColor: string,
  textColor: string,
  onClick: () => void
): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.textContent = text;
  btn.style.cssText = `
    display:block;width:100%;padding:8px 12px;border:none;border-radius:8px;
    background:${bgColor};color:${textColor};cursor:pointer;
    font-size:13px;font-weight:500;transition:opacity 0.2s;
  `;
  btn.onmouseenter = () => { btn.style.opacity = '0.85'; };
  btn.onmouseleave = () => { btn.style.opacity = '1'; };
  btn.onclick = onClick;
  return btn;
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initialize();
    startMutationObserver();
  });
} else {
  initialize();
  startMutationObserver();
}
