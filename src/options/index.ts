// Options 设置页面脚本 | DocBridge
import type { DisplayMode, GlossaryEntry } from '../shared/types';
import { GlossaryManager } from '../shared/storage/indexeddb';
import { DEFAULT_API_BASE_URL } from '../shared/constants';

/** DOM 元素引用 */
const apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
const apiBaseURLInput = document.getElementById('api-base-url') as HTMLInputElement;
const btnToggleKey = document.getElementById('btn-toggle-key') as HTMLButtonElement;
const glossaryList = document.getElementById('glossary-list') as HTMLDivElement;
const termInput = document.getElementById('term-input') as HTMLInputElement;
const termTranslation = document.getElementById('term-translation') as HTMLInputElement;
const termDomain = document.getElementById('term-domain') as HTMLInputElement;
const btnAddTerm = document.getElementById('btn-add-term') as HTMLButtonElement;
const whitelistTextarea = document.getElementById('whitelist') as HTMLTextAreaElement;
const blacklistTextarea = document.getElementById('blacklist') as HTMLTextAreaElement;
const defaultModeSelect = document.getElementById('default-mode') as HTMLSelectElement;
const btnSave = document.getElementById('btn-save') as HTMLButtonElement;
const saveHint = document.getElementById('save-hint') as HTMLSpanElement;

/**
 * 初始化：加载所有已保存配置
 */
async function init(): Promise<void> {
  const result = await chrome.storage.local.get([
    'apiKey',
    'apiBaseURL',
    'displayMode',
    'whitelist',
    'blacklist',
  ]);

  apiKeyInput.value = result.apiKey || '';
  apiBaseURLInput.value = result.apiBaseURL || DEFAULT_API_BASE_URL;
  defaultModeSelect.value = (result.displayMode as DisplayMode) || 'bilingual';
  whitelistTextarea.value = (result.whitelist || []).join('\n');
  blacklistTextarea.value = (result.blacklist || []).join('\n');

  // 加载术语表
  await renderGlossary();

  // 绑定事件
  bindEvents();
}

/**
 * 渲染术语表
 */
async function renderGlossary(): Promise<void> {
  const entries = await GlossaryManager.getAllGlossary();
  glossaryList.innerHTML = '';

  if (entries.length === 0) {
    glossaryList.innerHTML = '<p style="color:#999;font-size:13px;text-align:center;padding:12px;">暂无术语</p>';
    return;
  }

  for (const entry of entries) {
    const item = createGlossaryItem(entry);
    glossaryList.appendChild(item);
  }
}

/**
 * 创建术语项 DOM
 */
function createGlossaryItem(entry: GlossaryEntry): HTMLElement {
  const div = document.createElement('div');
  div.className = 'glossary-item';

  const termEl = document.createElement('span');
  termEl.className = 'glossary-term';
  termEl.textContent = entry.term;

  const arrow = document.createElement('span');
  arrow.className = 'glossary-arrow';
  arrow.textContent = '→';

  const transEl = document.createElement('span');
  transEl.className = 'glossary-translation';
  transEl.textContent = entry.translation;

  div.appendChild(termEl);
  div.appendChild(arrow);
  div.appendChild(transEl);

  // 领域标签
  if (entry.domain) {
    const domainEl = document.createElement('span');
    domainEl.className = 'glossary-domain';
    domainEl.textContent = entry.domain;
    div.appendChild(domainEl);
  }

  // 删除按钮
  const removeBtn = document.createElement('button');
  removeBtn.className = 'glossary-remove';
  removeBtn.textContent = '删除';
  removeBtn.onclick = async () => {
    await GlossaryManager.removeTerm(entry.term);
    await renderGlossary();
  };
  div.appendChild(removeBtn);

  return div;
}

/**
 * 绑定事件
 */
function bindEvents(): void {
  // 显隐 API 密钥
  btnToggleKey.addEventListener('click', () => {
    const isPassword = apiKeyInput.type === 'password';
    apiKeyInput.type = isPassword ? 'text' : 'password';
    btnToggleKey.textContent = isPassword ? '🙈' : '👁';
  });

  // 添加术语
  btnAddTerm.addEventListener('click', async () => {
    const term = termInput.value.trim();
    const translation = termTranslation.value.trim();
    const domain = termDomain.value.trim();

    if (!term || !translation) {
      showHint('请填写术语和翻译', 'error');
      return;
    }

    await GlossaryManager.addTerm(term, translation, domain);
    termInput.value = '';
    termTranslation.value = '';
    termDomain.value = '';
    await renderGlossary();
    showHint('术语已添加', 'success');
  });

  // 保存设置
  btnSave.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    const apiBaseURL = apiBaseURLInput.value.trim() || DEFAULT_API_BASE_URL;
    const displayMode = defaultModeSelect.value as DisplayMode;

    const whitelist = whitelistTextarea.value
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const blacklist = blacklistTextarea.value
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    try {
      await chrome.storage.local.set({
        apiKey,
        apiBaseURL,
        displayMode,
        whitelist,
        blacklist,
      });
      showHint('设置已保存', 'success');
    } catch (error) {
      showHint('保存失败：' + (error instanceof Error ? error.message : String(error)), 'error');
    }
  });
}

/**
 * 显示提示信息（2 秒自动消失）
 */
function showHint(text: string, type: 'success' | 'error'): void {
  saveHint.textContent = text;
  saveHint.style.color = type === 'success' ? '#52c41a' : '#ff4d4f';
  saveHint.classList.add('show');

  setTimeout(() => {
    saveHint.classList.remove('show');
  }, 2000);
}

// 初始化
document.addEventListener('DOMContentLoaded', init);
