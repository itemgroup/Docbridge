const SUPPORTED_PROTOCOLS = ["http:", "https:"];
const statusIcon = document.getElementById("status-icon");
const statusText = document.getElementById("status-text");
const btnTranslate = document.getElementById("btn-translate");
const btnRestore = document.getElementById("btn-restore");
const btnOptions = document.getElementById("btn-options");
const radioGroup = document.getElementsByName("display-mode");
let currentTabId = null;
let isSupported = false;
document.addEventListener("DOMContentLoaded", init);
async function init() {
  await detectCurrentTab();
  bindEvents();
}
async function detectCurrentTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab?.id || !tab.url) {
    setStatus("disabled", "无法获取页面信息");
    setControlsEnabled(false);
    return;
  }
  currentTabId = tab.id;
  try {
    const url = new URL(tab.url);
    if (!SUPPORTED_PROTOCOLS.includes(url.protocol)) {
      setStatus("disabled", "此页面不支持翻译");
      setControlsEnabled(false);
      return;
    }
    isSupported = true;
    setStatus("idle", "未翻译");
    setControlsEnabled(true);
  } catch {
    setStatus("disabled", "此页面不支持翻译");
    setControlsEnabled(false);
  }
}
function bindEvents() {
  btnTranslate.addEventListener("click", handleTranslate);
  btnRestore.addEventListener("click", handleRestore);
  radioGroup.forEach((radio) => {
    radio.addEventListener("change", handleModeChange);
  });
  btnOptions.addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
}
function handleTranslate() {
  if (!currentTabId || !isSupported) return;
  setStatus("running", "翻译中...");
  btnTranslate.disabled = true;
  chrome.tabs.sendMessage(currentTabId, {
    type: "START_TRANSLATE",
    payload: {}
  }).catch(() => {
    setStatus("idle", "翻译启动失败");
    btnTranslate.disabled = false;
  });
}
function handleRestore() {
  if (!currentTabId || !isSupported) return;
  chrome.tabs.sendMessage(currentTabId, {
    type: "TOGGLE_DISPLAY",
    payload: { mode: "original-only" }
  }).catch((err) => {
    console.warn("[DocBridge] 还原页面消息发送失败:", err);
  });
  const radio = document.querySelector(
    'input[name="display-mode"][value="original-only"]'
  );
  if (radio) radio.checked = true;
  setStatus("idle", "已还原");
}
function handleModeChange(e) {
  if (!currentTabId || !isSupported) return;
  const target = e.target;
  const mode = target.value;
  chrome.tabs.sendMessage(currentTabId, {
    type: "TOGGLE_DISPLAY",
    payload: { mode }
  }).catch((err) => {
    console.warn("[DocBridge] 模式切换消息发送失败:", err);
  });
}
function setStatus(type, text) {
  statusIcon.className = "status-icon";
  if (type === "running") {
    statusIcon.classList.add("running");
  }
  if (type === "disabled") {
    statusIcon.classList.add("disabled");
  }
  statusText.textContent = text;
}
function setControlsEnabled(enabled) {
  btnTranslate.disabled = !enabled;
  btnRestore.disabled = !enabled;
  radioGroup.forEach((r) => r.disabled = !enabled);
}
//# sourceMappingURL=index.js.map
