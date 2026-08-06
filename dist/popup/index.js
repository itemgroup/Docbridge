const SUPPORTED_PROTOCOLS = ["http:", "https:"];
const statusIcon = document.getElementById("status-icon");
const statusText = document.getElementById("status-text");
const btnTranslate = document.getElementById("btn-translate");
const btnRestore = document.getElementById("btn-restore");
const btnExport = document.getElementById("btn-export");
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
  btnTranslate.addEventListener("click", () => {
    void handleTranslate();
  });
  btnRestore.addEventListener("click", () => {
    void handleRestore();
  });
  btnExport.addEventListener("click", () => {
    void handleExport();
  });
  radioGroup.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      void handleModeChange(e);
    });
  });
  btnOptions.addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
}
async function handleTranslate() {
  if (!currentTabId || !isSupported) return;
  setStatus("running", "翻译中...");
  btnTranslate.disabled = true;
  const success = await sendToCurrentTab(currentTabId, {
    type: "START_TRANSLATE",
    payload: {}
  });
  if (!success) {
    setStatus("idle", "翻译启动失败");
    btnTranslate.disabled = false;
    return;
  }
}
async function handleRestore() {
  if (!currentTabId || !isSupported) return;
  const success = await sendToCurrentTab(currentTabId, {
    type: "TOGGLE_DISPLAY",
    payload: { mode: "original-only" }
  });
  if (!success) {
    console.warn("[DocBridge] 还原页面消息发送失败");
    return;
  }
  const radio = document.querySelector(
    'input[name="display-mode"][value="original-only"]'
  );
  if (radio) radio.checked = true;
  setStatus("idle", "已还原");
}
async function handleExport() {
  if (!currentTabId || !isSupported) return;
  const success = await sendToCurrentTab(currentTabId, {
    type: "EXPORT_HTML",
    payload: {}
  });
  if (!success) {
    console.warn("[DocBridge] 导出译文消息发送失败");
    return;
  }
  setStatus("idle", "已导出");
}
async function handleModeChange(e) {
  if (!currentTabId || !isSupported) return;
  const target = e.target;
  const mode = target.value;
  const success = await sendToCurrentTab(currentTabId, {
    type: "TOGGLE_DISPLAY",
    payload: { mode }
  });
  if (!success) {
    console.warn("[DocBridge] 模式切换消息发送失败");
  }
}
async function sendToCurrentTab(tabId, message) {
  try {
    await chrome.tabs.sendMessage(tabId, message);
    return true;
  } catch {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ["dist/content/index.js"]
      });
      await chrome.tabs.sendMessage(tabId, message);
      return true;
    } catch (err) {
      console.warn("[DocBridge] 发送消息失败，自动注入 content script 也未成功:", err);
      return false;
    }
  }
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
