(function() {
  "use strict";
  const statusText = document.getElementById("status-text");
  const btnTranslate = document.getElementById("btn-translate");
  const btnClear = document.getElementById("btn-clear");
  const btnExport = document.getElementById("btn-export");
  const linkOptions = document.getElementById("link-options");
  const radioModes = document.querySelectorAll('input[name="displayMode"]');
  let currentTabId = null;
  async function init() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (!tab || !tab.id) return;
    currentTabId = tab.id;
    const url = tab.url || "";
    const isTranslatable = url.startsWith("http://") || url.startsWith("https://");
    btnTranslate.disabled = !isTranslatable;
    btnClear.disabled = !isTranslatable;
    btnExport.disabled = !isTranslatable;
    if (!isTranslatable) {
      statusText.textContent = "此页面不支持翻译";
      statusText.className = "error";
    }
    bindEvents();
    const result = await chrome.storage.local.get("displayMode");
    const savedMode = result.displayMode || "bilingual";
    radioModes.forEach((radio) => {
      if (radio.value === savedMode) {
        radio.checked = true;
      }
    });
  }
  function bindEvents() {
    btnTranslate.addEventListener("click", async () => {
      if (!currentTabId) return;
      setStatus("翻译中...", "translating");
      try {
        await sendToContent({ type: "START_TRANSLATE", payload: null });
        setStatus("翻译完成", "ready");
      } catch {
        setStatus("发送失败", "error");
      }
    });
    btnClear.addEventListener("click", async () => {
      if (!currentTabId) return;
      try {
        await sendToContent({ type: "CLEAR_TRANSLATION", payload: null });
        setStatus("已还原", "ready");
      } catch {
        setStatus("发送失败", "error");
      }
    });
    btnExport.addEventListener("click", async () => {
      if (!currentTabId) return;
      try {
        await sendToContent({ type: "EXPORT_HTML", payload: null });
      } catch {
        setStatus("导出失败", "error");
      }
    });
    radioModes.forEach((radio) => {
      radio.addEventListener("change", async () => {
        if (!currentTabId) return;
        const mode = radio.value;
        try {
          await chrome.storage.local.set({ displayMode: mode });
          await sendToContent({ type: "TOGGLE_DISPLAY", payload: mode });
        } catch {
          setStatus("切换失败", "error");
        }
      });
    });
    linkOptions.addEventListener("click", (e) => {
      e.preventDefault();
      chrome.runtime.openOptionsPage();
    });
  }
  async function sendToContent(message) {
    if (!currentTabId) throw new Error("No active tab");
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(currentTabId, message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (response && !response.success) {
          reject(new Error(response.error || "未知错误"));
          return;
        }
        resolve();
      });
    });
  }
  function setStatus(text, className) {
    statusText.textContent = text;
    statusText.className = className;
  }
  document.addEventListener("DOMContentLoaded", init);
})();
