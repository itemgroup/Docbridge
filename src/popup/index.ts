// src/popup/index.ts — Popup 控制面板逻辑 | DocBridge | 2025-08-06

import type { DisplayMode, DTMessage } from '../shared/types';

/** 支持翻译的页面协议 */
const SUPPORTED_PROTOCOLS = ['http:', 'https:'];

// ---------- DOM 引用 ----------

const statusIcon = document.getElementById('status-icon') as HTMLElement;
const statusText = document.getElementById('status-text') as HTMLElement;
const btnTranslate = document.getElementById('btn-translate') as HTMLButtonElement;
const btnRestore = document.getElementById('btn-restore') as HTMLButtonElement;
const btnExport = document.getElementById('btn-export') as HTMLButtonElement;
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
  btnTranslate.addEventListener('click', () => {
    void handleTranslate();
  });
  btnRestore.addEventListener('click', () => {
    void handleRestore();
  });
  btnExport.addEventListener('click', () => {
    void handleExport();
  });

  radioGroup.forEach((radio) => {
    radio.addEventListener('change', (e) => {
      void handleModeChange(e);
    });
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
async function handleTranslate(): Promise<void> {
  if (!currentTabId || !isSupported) return;

  setStatus('running', '翻译中...');
  btnTranslate.disabled = true;

  const success = await sendToCurrentTab(currentTabId, {
    type: 'START_TRANSLATE',
    payload: {},
  });
  if (!success) {
    setStatus('idle', '翻译启动失败');
    btnTranslate.disabled = false;
    return;
  }

  // popup 关闭后 content script 仍在运行，状态在下次打开时刷新
}

/**
 * 点击"还原页面"：切换到仅原文模式
 */
async function handleRestore(): Promise<void> {
  if (!currentTabId || !isSupported) return;

  const success = await sendToCurrentTab(currentTabId, {
    type: 'TOGGLE_DISPLAY',
    payload: { mode: 'original-only' },
  });
  if (!success) {
    console.warn('[DocBridge] 还原页面消息发送失败');
    return;
  }

  // 同步 radio 选中
  const radio = document.querySelector<HTMLInputElement>(
    'input[name="display-mode"][value="original-only"]'
  );
  if (radio) radio.checked = true;
  setStatus('idle', '已还原');
}

/**
 * 点击"导出译文"：通知 content script 导出 HTML
 */
async function handleExport(): Promise<void> {
  if (!currentTabId || !isSupported) return;

  const success = await sendToCurrentTab(currentTabId, {
    type: 'EXPORT_HTML',
    payload: {},
  });
  if (!success) {
    console.warn('[DocBridge] 导出译文消息发送失败');
    return;
  }
  setStatus('idle', '已导出');
}

/**
 * 显示模式切换
 */
async function handleModeChange(e: Event): Promise<void> {
  if (!currentTabId || !isSupported) return;

  const target = e.target as HTMLInputElement;
  const mode = target.value as DisplayMode;

  const success = await sendToCurrentTab(currentTabId, {
    type: 'TOGGLE_DISPLAY',
    payload: mode,
  });
  if (!success) {
    console.warn('[DocBridge] 模式切换消息发送失败');
  }
}

// ---------- UI 辅助 ----------

async function sendToCurrentTab(tabId: number, message: DTMessage): Promise<boolean> {
  try {
    await chrome.tabs.sendMessage(tabId, message);
    return true;
  } catch {
    try {
      // 扩展重载后，已打开页面通常还没重新注入 content script，这里补注入一次再重试
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['dist/content/index.js'],
      });
      await chrome.tabs.sendMessage(tabId, message);
      return true;
    } catch (err: unknown) {
      console.warn('[DocBridge] 发送消息失败，自动注入 content script 也未成功:', err);
      return false;
    }
  }
}

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
