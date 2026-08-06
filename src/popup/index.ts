// src/popup/index.ts — Popup 控制面板逻辑 | DocBridge | 2025-08-06

import type { DisplayMode, DTMessage } from '../shared/types';

/** 支持翻译的页面协议 */
const SUPPORTED_PROTOCOLS = ['http:', 'https:'];

// ---------- DOM 引用 ----------

const statusIcon = document.getElementById('status-icon') as HTMLElement;
const statusText = document.getElementById('status-text') as HTMLElement;
const btnTranslate = document.getElementById('btn-translate') as HTMLButtonElement;
const btnRestore = document.getElementById('btn-restore') as HTMLButtonElement;
const btnOptions = document.getElementById('btn-options') as HTMLAnchorElement;
const radioGroup = document.getElementsByName('display-mode') as NodeListOf<HTMLInputElement>;

let currentTabId: number | null = null;
let isSupported = false;

// ---------- 初始化 ----------

document.addEventListener('DOMContentLoaded', init);

async function init(): Promise<void> {
  await detectCurrentTab();
  bindEvents();
}

/**
 * 检测当前 tab 是否支持翻译
 */
async function detectCurrentTab(): Promise<void> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];

  if (!tab?.id || !tab.url) {
    setStatus('disabled', '无法获取页面信息');
    setControlsEnabled(false);
    return;
  }

  currentTabId = tab.id;

  try {
    const url = new URL(tab.url);
    if (!SUPPORTED_PROTOCOLS.includes(url.protocol)) {
      setStatus('disabled', '此页面不支持翻译');
      setControlsEnabled(false);
      return;
    }
    isSupported = true;
    setStatus('idle', '未翻译');
    setControlsEnabled(true);
  } catch {
    setStatus('disabled', '此页面不支持翻译');
    setControlsEnabled(false);
  }
}

// ---------- 事件绑定 ----------

function bindEvents(): void {
  btnTranslate.addEventListener('click', handleTranslate);
  btnRestore.addEventListener('click', handleRestore);

  radioGroup.forEach((radio) => {
    radio.addEventListener('change', handleModeChange);
  });

  btnOptions.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
}

// ---------- 事件处理 ----------

/**
 * 点击"翻译页面"
 */
function handleTranslate(): void {
  if (!currentTabId || !isSupported) return;

  setStatus('running', '翻译中...');
  btnTranslate.disabled = true;

  chrome.tabs.sendMessage(currentTabId, {
    type: 'START_TRANSLATE',
    payload: {},
  } satisfies DTMessage).catch(() => {
    // content script 可能尚未注入
    setStatus('idle', '翻译启动失败');
    btnTranslate.disabled = false;
  });

  // popup 关闭后 content script 仍在运行，状态在下次打开时刷新
}

/**
 * 点击"还原页面"：切换到仅原文模式
 */
function handleRestore(): void {
  if (!currentTabId || !isSupported) return;

  chrome.tabs.sendMessage(currentTabId, {
    type: 'TOGGLE_DISPLAY',
    payload: { mode: 'original-only' },
  } satisfies DTMessage).catch((err: unknown) => {
    console.warn('[DocBridge] 还原页面消息发送失败:', err);
  });

  // 同步 radio 选中
  const radio = document.querySelector<HTMLInputElement>(
    'input[name="display-mode"][value="original-only"]'
  );
  if (radio) radio.checked = true;
  setStatus('idle', '已还原');
}

/**
 * 显示模式切换
 */
function handleModeChange(e: Event): void {
  if (!currentTabId || !isSupported) return;

  const target = e.target as HTMLInputElement;
  const mode = target.value as DisplayMode;

  chrome.tabs.sendMessage(currentTabId, {
    type: 'TOGGLE_DISPLAY',
    payload: { mode },
  } satisfies DTMessage).catch((err: unknown) => {
    console.warn('[DocBridge] 模式切换消息发送失败:', err);
  });
}

// ---------- UI 辅助 ----------

type StatusType = 'idle' | 'running' | 'disabled';

function setStatus(type: StatusType, text: string): void {
  statusIcon.className = 'status-icon';
  if (type === 'running') {
    statusIcon.classList.add('running');
  }
  if (type === 'disabled') {
    statusIcon.classList.add('disabled');
  }
  statusText.textContent = text;
}

function setControlsEnabled(enabled: boolean): void {
  btnTranslate.disabled = !enabled;
  btnRestore.disabled = !enabled;
  // 如果页面不支持，也禁用 mode 选择
  radioGroup.forEach((r) => (r.disabled = !enabled));
}
