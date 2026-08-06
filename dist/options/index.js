const STORAGE_KEY = "docbridge:options";
const DEFAULT_OPTIONS = {
  apiKey: "",
  glossary: {},
  displayMode: "bilingual",
  blacklist: [],
  whitelist: []
};
const inputApiKey = document.getElementById("api-key");
const btnToggleKey = document.getElementById("btn-toggle-key");
const btnSaveApiKey = document.getElementById("btn-save-apikey");
const selectDisplayMode = document.getElementById("display-mode");
const textareaBlacklist = document.getElementById("blacklist");
const textareaWhitelist = document.getElementById("whitelist");
const glossaryTbody = document.getElementById("glossary-tbody");
const inputTermEn = document.getElementById("term-en");
const inputTermZh = document.getElementById("term-zh");
const btnAddGlossary = document.getElementById("btn-add-glossary");
const toast = document.getElementById("toast");
let glossary = {};
document.addEventListener("DOMContentLoaded", init);
async function init() {
  await loadOptions();
  bindEvents();
}
async function loadOptions() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const data = { ...DEFAULT_OPTIONS, ...result[STORAGE_KEY] ?? {} };
  inputApiKey.value = data.apiKey ?? "";
  selectDisplayMode.value = data.displayMode ?? "bilingual";
  textareaBlacklist.value = (data.blacklist ?? []).join("\n");
  textareaWhitelist.value = (data.whitelist ?? []).join("\n");
  glossary = data.glossary ?? {};
  renderGlossary();
}
async function saveOptions(partial) {
  const current = await chrome.storage.local.get(STORAGE_KEY);
  const existing = { ...DEFAULT_OPTIONS, ...current[STORAGE_KEY] ?? {} };
  const merged = { ...existing, ...partial };
  await chrome.storage.local.set({ [STORAGE_KEY]: merged });
  showToast();
}
function bindEvents() {
  btnSaveApiKey.addEventListener("click", () => {
    saveOptions({ apiKey: inputApiKey.value.trim() });
  });
  btnToggleKey.addEventListener("click", () => {
    const isPassword = inputApiKey.type === "password";
    inputApiKey.type = isPassword ? "text" : "password";
    btnToggleKey.textContent = isPassword ? "隐藏" : "显示";
  });
  selectDisplayMode.addEventListener("change", () => {
    saveOptions({ displayMode: selectDisplayMode.value });
  });
  textareaBlacklist.addEventListener("blur", () => {
    saveOptions({ blacklist: parseTextarea(textareaBlacklist) });
  });
  textareaWhitelist.addEventListener("blur", () => {
    saveOptions({ whitelist: parseTextarea(textareaWhitelist) });
  });
  btnAddGlossary.addEventListener("click", handleAddGlossary);
  inputTermZh.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleAddGlossary();
  });
}
function handleAddGlossary() {
  const en = inputTermEn.value.trim();
  const zh = inputTermZh.value.trim();
  if (!en) return;
  glossary[en] = zh;
  inputTermEn.value = "";
  inputTermZh.value = "";
  inputTermEn.focus();
  renderGlossary();
  saveOptions({ glossary: { ...glossary } });
}
function handleDeleteGlossary(term) {
  delete glossary[term];
  renderGlossary();
  saveOptions({ glossary: { ...glossary } });
}
function renderGlossary() {
  const entries = Object.entries(glossary);
  glossaryTbody.innerHTML = "";
  if (entries.length === 0) {
    const tr = document.createElement("tr");
    tr.className = "empty-row";
    const td = document.createElement("td");
    td.colSpan = 3;
    td.textContent = "暂无术语";
    tr.appendChild(td);
    glossaryTbody.appendChild(tr);
    return;
  }
  for (const [en, zh] of entries) {
    const tr = document.createElement("tr");
    const tdEn = document.createElement("td");
    tdEn.textContent = en;
    tr.appendChild(tdEn);
    const tdZh = document.createElement("td");
    tdZh.textContent = zh;
    tr.appendChild(tdZh);
    const tdAction = document.createElement("td");
    const btnDelete = document.createElement("button");
    btnDelete.className = "btn btn-danger";
    btnDelete.textContent = "删除";
    btnDelete.addEventListener("click", () => handleDeleteGlossary(en));
    tdAction.appendChild(btnDelete);
    tr.appendChild(tdAction);
    glossaryTbody.appendChild(tr);
  }
}
function parseTextarea(el) {
  return el.value.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
}
let toastTimer = null;
function showToast() {
  toast.classList.remove("hidden");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 2e3);
}
//# sourceMappingURL=index.js.map
