// Content Script 入口 | 页面翻译全流程组装 + SPA 自动翻译
import type { DTMessage, DisplayMode, TranslatedUnit } from '../shared/types';
import { scanPage } from './scanner/dom-scanner';
import { buildBatches } from './analyzer/unit-builder';
import { TranslationQueue } from './translator/translation-queue';
import { renderTranslation, applyDisplayMode, clearTranslation, exportHTML, injectGlobalStyles } from './renderer/dom-renderer';
import { DOM_DEBOUNCE_MS } from '../shared/constants';

/** 当前显示模式 */
let currentMode: DisplayMode = 'bilingual';

/** 翻译是否进行中 */
let isTranslating = false;

/** 页面是否被锁定（防止 MutationObserver 重复触发） */
let isLocked = false;

/** 已翻译结果缓存 */
let translatedResults: TranslatedUnit[] = [];

/** 翻译队列实例 */
const queue = new TranslationQueue();

/** MutationObserver 实例 */
let observer: MutationObserver | null = null;

/** 防抖定时器 */
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 注入全局样式和浮动控制栏
 */
function initialize(): void {
  injectGlobalStyles();
  createFloatingBar();

  // 监听来自 popup 的消息
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
        await translatePage();
        return { success: true };

      case 'TOGGLE_DISPLAY':
        currentMode = (message.payload as DisplayMode) || 'bilingual';
        applyDisplayMode(currentMode);
        // 如果切换到 bilingual/translated-only 且有结果，重新渲染
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
        // 通过 Blob 下载
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
 * 完整翻译流程
 */
async function translatePage(): Promise<void> {
  if (isTranslating) return;
  isTranslating = true;
  isLocked = true;

  try {
    console.log('[DocBridge] 开始扫描页面...');
    const units = await scanPage(document.body);

    if (units.length === 0) {
      console.log('[DocBridge] 未发现需要翻译的文本');
      return;
    }

    console.log(`[DocBridge] 发现 ${units.length} 个翻译单元`);

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
  } finally {
    isTranslating = false;
    isLocked = false;
  }
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
 * 启动 SPA DOM 变化监听
 */
function startMutationObserver(): void {
  if (observer) return;

  observer = new MutationObserver((mutations) => {
    // 锁定期间忽略
    if (isLocked || isTranslating) return;

    let hasNewContent = false;

    for (const mutation of mutations) {
      // 忽略译文节点变化
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            // 忽略 dt-bridge 节点
            if (el.classList.contains('dt-bridge')) continue;
            // 忽略 dt 控制栏
            if (el.id === 'dt-floating-bar') continue;
            hasNewContent = true;
            break;
          }
        }
      }
      if (hasNewContent) break;
    }

    if (!hasNewContent) return;

    // 防抖
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      console.log('[DocBridge] 检测到 DOM 变化，自动翻译新内容...');
      translatePage();
    }, DOM_DEBOUNCE_MS);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
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

  // 标题
  const title = document.createElement('div');
  title.textContent = 'DocBridge';
  title.style.cssText = 'font-weight:700;text-align:center;color:#1890ff;font-size:14px;margin-bottom:4px;';
  bar.appendChild(title);

  // 翻译按钮
  const translateBtn = createButton('翻译', '#1890ff', '#fff', () => {
    translatePage();
  });
  bar.appendChild(translateBtn);

  // 模式切换按钮组
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

  // 还原按钮
  const clearBtn = createButton('还原', '#ff4d4f', '#fff', () => {
    clearTranslation();
    translatedResults = [];
    currentMode = 'bilingual';
  });
  bar.appendChild(clearBtn);

  document.body.appendChild(bar);
}

/**
 * 创建按钮辅助函数
 */
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
