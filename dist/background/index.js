const DEEPSEEK_API_CONFIG = {
  baseURL: "https://api.deepseek.com/v1",
  model: "deepseek-chat",
  temperature: 0.3,
  max_tokens: 4096,
  timeout: 1e4
};
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1e3;
const SYSTEM_PROMPT = `将以下英文技术内容翻译为简体中文。

规则：
1. 技术术语保留英文：React, Vue, API, DOM, CSS, HTML, HTTP, URL, GitHub, JSON, TypeScript, JavaScript, Python, Docker, Kubernetes, Linux, Git, CLI, SDK, UI, UX, SQL, NoSQL, REST, GraphQL, WebSocket, OAuth, JWT, CI/CD, CRUD, MVC, MVVM, Hooks, middleware, debounce, throttle, OpenVINO, LLM, AI, ML, GPU, CPU, ONNX
2. 代码、变量名、URL、命令行保持原样
3. 只翻译自然语言

输出格式（严格遵守，每行一个）：
ID:单元ID|||中文译文

示例：
ID:u_abc123|||这是一个示例译文。
ID:u_def456|||useState 用于在函数组件中添加状态。

禁止输出任何其他内容，禁止 Markdown，禁止解释。`;
class DeepSeekProvider {
  constructor(apiKey) {
    this.name = "deepseek";
    this.maxBatchSize = 20;
    this.supportsContext = true;
    this.apiKey = apiKey;
  }
  /** 更新 API Key */
  setApiKey(key) {
    this.apiKey = key;
  }
  /**
   * 执行批量翻译（TranslationProvider 接口实现）
   */
  async translate(request) {
    if (!this.apiKey) {
      throw new Error("DeepSeek API Key 未配置");
    }
    if (request.units.length === 0) return [];
    return this.translateBatch(request);
  }
  /**
   * 发送翻译请求到 DeepSeek API
   */
  async translateBatch(request) {
    console.log("[DeepSeek] 开始翻译，单元数:", request.units.length);
    const baseURL = DEEPSEEK_API_CONFIG.baseURL;
    const rawContent = await this.fetchWithRetry(
      `${baseURL}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: DEEPSEEK_API_CONFIG.model,
          temperature: DEEPSEEK_API_CONFIG.temperature,
          max_tokens: DEEPSEEK_API_CONFIG.max_tokens,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: this.buildPrompt(request) }
          ]
        })
      }
    );
    console.log("[DeepSeek] API 原始返回:\n", rawContent.substring(0, 500));
    return this.parseResponse(rawContent, request.units);
  }
  /**
   * 构建发送给模型的用户消息
   */
  buildPrompt(request) {
    let prompt = "";
    request.units.forEach((unit) => {
      prompt += `ID:${unit.id}
内容：${unit.text}

`;
    });
    return prompt;
  }
  /**
   * 解析 API 返回内容：ID:xxx|||yyy 格式
   */
  parseResponse(content, units) {
    const results = [];
    const unitMap = new Map(units.map((u) => [u.id, u]));
    const lines = content.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const match = trimmed.match(/^ID:([a-zA-Z0-9_-]+)\|\|\|(.*)$/);
      if (!match) continue;
      const id = match[1];
      const translatedText = match[2].trim();
      const originalUnit = unitMap.get(id);
      if (originalUnit) {
        results.push({
          id,
          translatedText: translatedText || originalUnit.text,
          originalUnit: null
        });
        unitMap.delete(id);
      }
    }
    for (const [, unit] of unitMap) {
      results.push({
        id: unit.id,
        translatedText: unit.text,
        originalUnit: null
      });
    }
    console.log(
      "[DeepSeek] 解析结果:",
      results.map((r) => ({
        id: r.id,
        text: r.translatedText.substring(0, 40)
      }))
    );
    return results;
  }
  /**
   * 带超时和指数退避重试的 fetch 请求
   */
  async fetchWithRetry(url, init2) {
    let lastError = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          DEEPSEEK_API_CONFIG.timeout
        );
        const response = await fetch(url, { ...init2, signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          throw new Error(`API ${response.status}: ${errorText.slice(0, 200)}`);
        }
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content ?? "";
        return content;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
          console.warn(
            `[DocBridge] DeepSeek 请求失败，${delay}ms 后重试 (${attempt + 1}/${MAX_RETRIES}):`,
            lastError.message
          );
          await this.sleep(delay);
        }
      }
    }
    throw lastError ?? new Error("DeepSeek 请求失败：未知错误");
  }
  /** 延迟工具函数 */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
const CACHE_PREFIX = "docbridge:cache:";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1e3;
let translateProvider = null;
(async function init() {
  const result = await chrome.storage.local.get("docbridge:options");
  const options = result["docbridge:options"];
  const apiKey = options?.apiKey;
  if (apiKey) {
    translateProvider = new DeepSeekProvider(apiKey);
  }
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    const optionsChange = changes["docbridge:options"];
    if (optionsChange?.newValue?.apiKey !== void 0) {
      const newKey = optionsChange.newValue.apiKey;
      if (newKey) {
        if (translateProvider) {
          translateProvider.setApiKey(newKey);
        } else {
          translateProvider = new DeepSeekProvider(newKey);
        }
      } else {
        translateProvider = null;
      }
    }
  });
  clearExpiredCache().catch((err) => {
    console.error("[DocBridge] 清理过期缓存失败:", err);
  });
})();
async function getCache(originalHash) {
  const key = CACHE_PREFIX + originalHash;
  const result = await chrome.storage.local.get(key);
  const entry = result[key];
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    await chrome.storage.local.remove(key);
    return null;
  }
  return entry.translatedText;
}
async function setCache(originalHash, translatedText) {
  const key = CACHE_PREFIX + originalHash;
  const entry = { translatedText, timestamp: Date.now() };
  await chrome.storage.local.set({ [key]: entry });
}
async function clearExpiredCache() {
  const all = await chrome.storage.local.get(null);
  const expiredKeys = [];
  const now = Date.now();
  for (const [key, value] of Object.entries(all)) {
    if (!key.startsWith(CACHE_PREFIX)) continue;
    const entry = value;
    if (now - entry.timestamp > CACHE_TTL_MS) {
      expiredKeys.push(key);
    }
  }
  if (expiredKeys.length > 0) {
    await chrome.storage.local.remove(expiredKeys);
  }
}
chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {
    (async () => {
      try {
        const result = await handleMessage(message, sender);
        sendResponse(result);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error("[DocBridge] 消息处理失败:", errorMsg);
        sendResponse({ success: false, error: errorMsg });
      }
    })();
    return true;
  }
);
async function handleMessage(message, sender) {
  switch (message.type) {
    case "GET_CACHE": {
      const { originalHash } = message.payload;
      const translated = await getCache(originalHash);
      return { translatedText: translated };
    }
    case "SET_CACHE": {
      const { originalHash, translatedText } = message.payload;
      await setCache(originalHash, translatedText);
      return { success: true };
    }
    case "TRANSLATE": {
      console.log("[DocBridge] background 收到 TRANSLATE 消息, units:", message.payload.units ? message.payload.units.length : 0);
      const { units, glossary, targetLang } = message.payload;
      console.log("[DocBridge] translateProvider 状态:", translateProvider ? "已初始化" : "NULL (无API Key)");
      const cached = [];
      const uncached = [];
      for (const unit of units) {
        const hash = await simpleHash(unit.text);
        const cachedText = await getCache(hash);
        if (cachedText) {
          cached.push({ id: unit.id, translatedText: cachedText });
        } else {
          uncached.push(unit);
        }
      }
      console.log("[DocBridge] 缓存命中:", cached.length, ", 未命中:", uncached.length);
      if (uncached.length > 0 && !translateProvider) {
        console.error("[DocBridge] API Key 未配置，无法翻译");
        throw new Error("DeepSeek API Key 未配置");
      }
      if (uncached.length > 0 && translateProvider) {
        console.log("[DocBridge] 开始调用 DeepSeek API, 单元数:", uncached.length);
        const request = {
          units: uncached,
          glossary,
          targetLang
        };
        const translated = await translateProvider.translate(request);
        console.log("[DocBridge] DeepSeek 返回", translated.length, "条翻译");
        for (const t of translated) {
          const original = uncached.find((u) => u.id === t.id);
          if (original) {
            const hash = await simpleHash(original.text);
            await setCache(hash, t.translatedText);
          }
          cached.push({ id: t.id, translatedText: t.translatedText });
        }
      }
      console.log("[DocBridge] background 返回翻译结果:", cached.length, "条");
      return { success: true, data: cached };
    }
    case "TOGGLE_DISPLAY": {
      const mode = message.payload;
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (tab.id == null) continue;
        try {
          await chrome.tabs.sendMessage(tab.id, {
            type: "TOGGLE_DISPLAY",
            payload: mode
          });
        } catch {
        }
      }
      return { success: true };
    }
    default:
      return { error: `未知消息类型: ${message.type}` };
  }
}
async function simpleHash(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
//# sourceMappingURL=index.js.map
