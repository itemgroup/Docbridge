// src/options/index.ts — Options 设置页逻辑 | DocBridge | 2025-08-06

import type { DisplayMode } from '../shared/types';

/** 存储键 */
const STORAGE_KEY = 'docbridge:options';

/** 配置结构 */
interface OptionsData {
  apiKey: string;
  glossary: Record<string, string>;
  displayMode: DisplayMode;
  blacklist: string[];
  whitelist: string[];
}

/** 默认配置 */
const DEFAULT_OPTIONS: OptionsData = {
  apiKey: '',
  glossary: {},
  displayMode: 'bilingual',
  blacklist: [],
  whitelist: [],
};

// ---------- DOM 引用 ----------

const inputApiKey = document.getElementById('api-key') as HTMLInputElement;
const btnToggleKey = document.getElementById('btn-toggle-key') as HTMLButtonElement;
const btnSaveApiKey = document.getElementById('btn-save-apikey') as HTMLButtonElement;
const selectDisplayMode = document.getElementById('display-mode') as HTMLSelectElement;
const textareaBlacklist = document.getElementById('blacklist') as HTMLTextAreaElement;
const textareaWhitelist = document.getElementById('whitelist') as HTMLTextAreaElement;
const glossaryTbody = document.getElementById('glossary-tbody') as HTMLTableSectionElement;
const inputTermEn = document.getElementById('term-en') as HTMLInputElement;
const inputTermZh = document.getElementById('term-zh') as HTMLInputElement;
const btnAddGlossary = document.getElementById('btn-add-glossary') as HTMLButtonElement;
const toast = document.getElementById('toast') as HTMLDivElement;

/** 当前术语表（内存缓存，与 storage 同步） */
let glossary: Record<string, string> = {};

// ---------- 初始化 ----------

document.addEventListener('DOMContentLoaded', init);

async function init(): Promise<void> {
  await loadOptions();
  bindEvents();
}

/**
 * 从 chrome.storage.local 加载所有配置
 */
async function loadOptions(): Promise<void> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const data: OptionsData = { ...DEFAULT_OPTIONS, ...(result[STORAGE_KEY] ?? {}) };

  // 回填表单
  inputApiKey.value = data.apiKey ?? '';
  selectDisplayMode.value = data.displayMode ?? 'bilingual';
  textareaBlacklist.value = (data.blacklist ?? []).join('\n');
  textareaWhitelist.value = (data.whitelist ?? []).join('\n');

  glossary = data.glossary ?? {};
  renderGlossary();
}

/**
 * 保存所有配置到 chrome.storage.local
 */
async function saveOptions(partial: Partial<OptionsData>): Promise<void> {
  const current = await chrome.storage.local.get(STORAGE_KEY);
  const existing: OptionsData = { ...DEFAULT_OPTIONS, ...(current[STORAGE_KEY] ?? {}) };
  const merged: OptionsData = { ...existing, ...partial };
  await chrome.storage.local.set({ [STORAGE_KEY]: merged });
  showToast();
}

// ---------- 事件绑定 ----------

function bindEvents(): void {
  // API Key 保存
  btnSaveApiKey.addEventListener('click', () => {
    saveOptions({ apiKey: inputApiKey.value.trim() });
  });

  // API Key 显示/隐藏切换
  btnToggleKey.addEventListener('click', () => {
    const isPassword = inputApiKey.type === 'password';
    inputApiKey.type = isPassword ? 'text' : 'password';
    btnToggleKey.textContent = isPassword ? '隐藏' : '显示';
  });

  // 显示模式切换（实时保存）
  selectDisplayMode.addEventListener('change', () => {
    saveOptions({ displayMode: selectDisplayMode.value as DisplayMode });
  });

  // 黑名单（失焦时保存）
  textareaBlacklist.addEventListener('blur', () => {
    saveOptions({ blacklist: parseTextarea(textareaBlacklist) });
  });

  // 白名单（失焦时保存）
  textareaWhitelist.addEventListener('blur', () => {
    saveOptions({ whitelist: parseTextarea(textareaWhitelist) });
  });

  // 添加术语
  btnAddGlossary.addEventListener('click', handleAddGlossary);
  // 回车快捷添加
  inputTermZh.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAddGlossary();
  });
}

// ---------- 术语表逻辑 ----------

/**
 * 添加术语
 */
function handleAddGlossary(): void {
  const en = inputTermEn.value.trim();
  const zh = inputTermZh.value.trim();
  if (!en) return;

  glossary[en] = zh;
  inputTermEn.value = '';
  inputTermZh.value = '';
  inputTermEn.focus();

  renderGlossary();
  saveOptions({ glossary: { ...glossary } });
}

/**
 * 删除术语
 */
function handleDeleteGlossary(term: string): void {
  delete glossary[term];
  renderGlossary();
  saveOptions({ glossary: { ...glossary } });
}

/**
 * 渲染术语表
 */
function renderGlossary(): void {
  const entries = Object.entries(glossary);
  glossaryTbody.innerHTML = '';

  if (entries.length === 0) {
    const tr = document.createElement('tr');
    tr.className = 'empty-row';
    const td = document.createElement('td');
    td.colSpan = 3;
    td.textContent = '暂无术语';
    tr.appendChild(td);
    glossaryTbody.appendChild(tr);
    return;
  }

  for (const [en, zh] of entries) {
    const tr = document.createElement('tr');

    const tdEn = document.createElement('td');
    tdEn.textContent = en;
    tr.appendChild(tdEn);

    const tdZh = document.createElement('td');
    tdZh.textContent = zh;
    tr.appendChild(tdZh);

    const tdAction = document.createElement('td');
    const btnDelete = document.createElement('button');
    btnDelete.className = 'btn btn-danger';
    btnDelete.textContent = '删除';
    btnDelete.addEventListener('click', () => handleDeleteGlossary(en));
    tdAction.appendChild(btnDelete);
    tr.appendChild(tdAction);

    glossaryTbody.appendChild(tr);
  }
}

// ---------- 辅助函数 ----------

/**
 * 解析 textarea 内容为字符串数组
 */
function parseTextarea(el: HTMLTextAreaElement): string[] {
  return el.value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * 显示保存成功提示
 */
let toastTimer: ReturnType<typeof setTimeout> | null = null;

function showToast(): void {
  toast.classList.remove('hidden');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add('hidden');
  }, 2000);
}
