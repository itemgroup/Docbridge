// Popup 弹窗控制脚本 | DocBridge
import type { DTMessage, DisplayMode } from '../shared/types';

/** 状态元素 */
const statusText = document.getElementById('status-text') as HTMLSpanElement;
const btnTranslate = document.getElementById('btn-translate') as HTMLButtonElement;
const btnClear = document.getElementById('btn-clear') as HTMLButtonElement;
const btnExport = document.getElementById('btn-export') as HTMLButtonElement;
const linkOptions = document.getElementById('link-options') as HTMLAnchorElement;
const radioModes = document.querySelectorAll<HTMLInputElement>('input[name="displayMode"]');

/** 当前标签页 ID */
let currentTabId: number | null = null;

/**
 * 初始化弹窗
 */
async function init(): Promise<void> {
  // 获取当前激活标签页
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab || !tab.id) return;

  currentTabId = tab.id;
  const url = tab.url || '';

  // 检查是否可翻译的页面
  const isTranslatable = url.startsWith('http://') || url.startsWith('https://');
  btnTranslate.disabled = !isTranslatable;
  btnClear.disabled = !isTranslatable;
  btnExport.disabled = !isTranslatable;

  if (!isTranslatable) {
    statusText.textContent = '此页面不支持翻译';
    statusText.className = 'error';
  }

  // 绑定事件
  bindEvents();

  // 加载已保存的显示模式
  const result = await chrome.storage.local.get('displayMode');
  const savedMode: DisplayMode = result.displayMode || 'bilingual';
  radioModes.forEach((radio) => {
    if (radio.value === savedMode) {
      radio.checked = true;
    }
  });
}

/**
 * 绑定按钮事件
 */
function bindEvents(): void {
  // 翻译按钮
  btnTranslate.addEventListener('click', async () => {
    if (!currentTabId) return;
    setStatus('翻译中...', 'translating');
    try {
      await sendToContent({ type: 'START_TRANSLATE', payload: null });
      setStatus('翻译完成', 'ready');
    } catch {
      setStatus('发送失败', 'error');
    }
  });

  // 还原按钮
  btnClear.addEventListener('click', async () => {
    if (!currentTabId) return;
    try {
      await sendToContent({ type: 'CLEAR_TRANSLATION', payload: null });
      setStatus('已还原', 'ready');
    } catch {
      setStatus('发送失败', 'error');
    }
  });

  // 导出按钮
  btnExport.addEventListener('click', async () => {
    if (!currentTabId) return;
    try {
      await sendToContent({ type: 'EXPORT_HTML', payload: null });
    } catch {
      setStatus('导出失败', 'error');
    }
  });

  // 模式切换
  radioModes.forEach((radio) => {
    radio.addEventListener('change', async () => {
      if (!currentTabId) return;
      const mode = radio.value as DisplayMode;
      try {
        // 保存设置
        await chrome.storage.local.set({ displayMode: mode });
        await sendToContent({ type: 'TOGGLE_DISPLAY', payload: mode });
      } catch {
        setStatus('切换失败', 'error');
      }
    });
  });

  // 设置链接
  linkOptions.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
}

/**
 * 向 content script 发送消息
 */
async function sendToContent(message: DTMessage): Promise<void> {
  if (!currentTabId) throw new Error('No active tab');

  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(currentTabId!, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (response && !response.success) {
        reject(new Error(response.error || '未知错误'));
        return;
      }
      resolve();
    });
  });
}

/**
 * 设置状态文本
 */
function setStatus(text: string, className: string): void {
  statusText.textContent = text;
  statusText.className = className;
}

// 初始化
document.addEventListener('DOMContentLoaded', init);
