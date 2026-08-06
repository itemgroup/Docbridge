// src/content/index.ts — 内容脚本入口：模块组装、SPA监听、消息通信 | DocBridge | 2025-08-06

import type { DisplayMode } from '../shared/types';
import { DOMScanner } from './scanner/dom-scanner';
import { UnitBuilder } from './analyzer/unit-builder';
import { TranslationQueue } from './translator/translation-queue';
import { DOMRenderer } from './renderer/dom-renderer';

// ---------- 全局状态 ----------

let renderer: DOMRenderer | null = null;
let observer: MutationObserver | null = null;
let lastUrl = location.href;
let translateTimer: ReturnType<typeof setTimeout> | null = null;
let isTranslating = false;
/** 还原/模式切换期间暂停 MutationObserver，防止自身 DOM 操作触发重翻 */
let isRestoring = false;

// ---------- 初始化 ----------

(function init(): void {
  setupMessageListener();
  setupMutationObserver();
  // 页面加载时不清除旧栏（如果有），init 时不翻译
  ensureFloatingBar();
})();

// ---------- 核心翻译流程 ----------

/**
 * 扫描 → 构建 → 翻译 → 渲染 全流程
 */
async function translatePage(): Promise<void> {
  if (isTranslating) return;
  isTranslating = true;

  try {
    // 清除旧译文状态，确保重新扫描不被旧标记干扰
    renderer?.clear();

    // Step 1: 扫描 DOM
    const scanner = new DOMScanner();
    const units = scanner.scan();

    // Step 2: 构建上下文链 + 分批
    const builder = new UnitBuilder();
    const batches = builder.build(units);

    if (batches.length === 0) {
      console.log('[DocBridge] 无可翻译内容');
      isTranslating = false;
      return;
    }

    // Step 3: 初始化渲染器
    if (!renderer) {
      renderer = new DOMRenderer();
    }

    // Step 4: 按批次翻译
    const unitCount = batches.reduce((sum, b) => sum + b.length, 0);
    console.log(`[DocBridge] 扫描到 ${unitCount} 个翻译单元，${batches.length} 个批次`);

    // 翻译期间断开 MutationObserver，防止自身触发的 DOM 变更导致死循环
    disconnectObserver();

    const queue = new TranslationQueue({
      onProgress: (done, total) => {
        console.log(`[DocBridge] 翻译进度: ${done}/${total}`);
      },
      onComplete: (results) => {
        console.log(`[DocBridge] onComplete: ${results.length} 个结果 → 传入 renderer`);
        if (results.length > 0) {
          const sample = results[0];
          console.log('[DocBridge] 首个结果:', sample.id, '译文:', sample.translatedText?.slice(0, 50), 'originalUnit:', sample.originalUnit ? '存在' : 'NULL');
        }
        if (renderer) renderer.render(results);
        console.log(`[DocBridge] 翻译完成: ${results.length} 个单元已渲染`);
        isTranslating = false;
        // 延迟重连 Observer，等渲染触发的 DOM 变更都完成后再监听
        setTimeout(connectObserver, 500);
      },
      onError: (err) => {
        console.error('[DocBridge] 翻译错误:', err.message);
      },
    });

    await queue.start(batches);
    queue.destroy();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[DocBridge] 翻译流程异常:', msg);
    isTranslating = false;
    connectObserver();
  }
}

// ---------- SPA 路由监听 ----------

/**
 * 使用 MutationObserver 检测 URL 变化或大量 DOM 新增
 * 翻译期间已 disconnect，避免自身产生的 DOM 变更触发循环
 */
function setupMutationObserver(): void {
  observer = new MutationObserver(() => {
    // 还原/模式切换期间跳过，防止重新翻译
    if (isRestoring) return;

    // 防抖 1000ms
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
        'p:not([data-dt-processed]):not([data-dt-translated]), ' +
        'h1:not([data-dt-processed]):not([data-dt-translated]), ' +
        'h2:not([data-dt-processed]):not([data-dt-translated]), ' +
        'h3:not([data-dt-processed]):not([data-dt-translated]), ' +
        'li:not([data-dt-processed]):not([data-dt-translated]), ' +
        'td:not([data-dt-processed]):not([data-dt-translated])'
      );
      if (unprocessed.length > 5) {
        translatePage();
      }
    }, 1000);
  });

  connectObserver();
}

function connectObserver(): void {
  if (observer) {
    observer.observe(document.body, { childList: true, subtree: true });
  }
}

function disconnectObserver(): void {
  if (observer) {
    observer.disconnect();
  }
}

// ---------- 消息监听 ----------

/**
 * 监听 popup / background 发来的消息
 */
function setupMessageListener(): void {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    try {
      switch (message.type) {
        case 'TOGGLE_DISPLAY': {
          const mode = message.payload as DisplayMode;
          if (renderer) {
            disconnectObserver();
            if (translateTimer) { clearTimeout(translateTimer); translateTimer = null; }
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
        case 'START_TRANSLATE': {
          disconnectObserver();
          renderer?.clear();
          translatePage();
          sendResponse({ success: true });
          break;
        }
        case 'EXPORT_HTML': {
          if (renderer) {
            renderer.exportHTML();
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false, error: '渲染器未初始化' });
          }
          break;
        }
        default:
          break;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[DocBridge] 消息处理异常:', msg);
      sendResponse({ error: msg });
    }
    return true;
  });
}

// ---------- 悬浮控制栏 ----------

/**
 * 确保悬浮栏存在（幂等操作，重复调用不重复创建）
 */
function ensureFloatingBar(): void {
  if (document.getElementById('docbridge-floating-bar')) return;
  injectFloatingBar();
}

/**
 * 在页面右下角注入悬浮控制栏
 * 所有按钮操作前 disconnectObserver，操作后延迟 reconnectObserver
 * 避免自身 DOM 变更触发重新翻译
 */
function injectFloatingBar(): void {
  const bar = document.createElement('div');
  bar.id = 'docbridge-floating-bar';
  bar.style.cssText = [
    'position:fixed',
    'bottom:20px',
    'right:20px',
    'z-index:2147483647',
    'display:flex',
    'gap:6px',
    'padding:8px 12px',
    'background:rgba(255,255,255,0.95)',
    'border:1px solid #d9d9d9',
    'border-radius:8px',
    'box-shadow:0 2px 12px rgba(0,0,0,0.12)',
    'font-family:sans-serif',
    'font-size:13px',
  ].join(';');

  /** 执行带 observer 保护的操作 */
  function safeAction(action: () => void, reconnectDelay = 300): void {
    disconnectObserver();
    if (translateTimer) { clearTimeout(translateTimer); translateTimer = null; }
    isRestoring = true;
    action();
    // 延迟重置 isRestoring，等 DOM 操作产生的 mutation 都触发完
    setTimeout(() => {
      isRestoring = false;
      connectObserver();
    }, reconnectDelay);
  }

  bar.appendChild(createBtn('还原', () => {
    safeAction(() => {
      renderer?.clear();
    }, 300);
  }, '#595959', '#fff'));

  // 分隔线
  bar.appendChild(createSep());

  bar.appendChild(createBtn('双语', () => {
    safeAction(() => {
      renderer?.setMode('bilingual');
    }, 200);
  }, '#52c41a', '#fff'));

  bar.appendChild(createBtn('仅译文', () => {
    safeAction(() => {
      renderer?.setMode('translated-only');
    }, 200);
  }, '#faad14', '#fff'));

  bar.appendChild(createBtn('仅原文', () => {
    safeAction(() => {
      renderer?.setMode('original-only');
    }, 200);
  }, '#d9d9d9', '#333'));

  // 分隔线
  bar.appendChild(createSep());

  bar.appendChild(createBtn('导出', () => {
    safeAction(() => {
      renderer?.exportHTML();
    }, 300);
  }, '#722ed1', '#fff'));

  document.body.appendChild(bar);
}

function createSep(): HTMLSpanElement {
  const sep = document.createElement('span');
  sep.style.cssText = 'color:#d9d9d9;line-height:28px;';
  sep.textContent = '|';
  return sep;
}

function createBtn(
  text: string,
  onClick: () => void,
  bgColor: string,
  color: string
): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.textContent = text;
  btn.style.cssText = [
    'padding:4px 10px',
    `background:${bgColor}`,
    `color:${color}`,
    'border:none',
    'border-radius:4px',
    'cursor:pointer',
    'font-size:12px',
    'line-height:20px',
    'white-space:nowrap',
  ].join(';');
  btn.addEventListener('click', onClick);
  return btn;
}
