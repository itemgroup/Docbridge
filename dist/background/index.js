const DEEPSEEK_API_CONFIG = {
  baseURL: "https://api.deepseek.com/v1",
  model: "deepseek-chat",
  temperature: 0.3,
  max_tokens: 4096,
  timeout: 1e4
};
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1e3;
const SYSTEM_PROMPT = `你是一位专业的技术文档翻译专家，将用户提供的英文技术文档内容翻译为简体中文。
【核心规则】
信：忠实原文技术含义；达：译文通顺易懂；雅：符合中文技术文档表达习惯
以下技术术语保留英文不翻译：React, Vue, Angular, Node.js, npm, API, DOM, CSS, HTML, HTTP, URL, GitHub, JSON, TypeScript, JavaScript, Python, Docker, Kubernetes, Linux, Git, CLI, SDK, UI, UX, SQL, NoSQL, REST, GraphQL, WebSocket, OAuth, JWT, CI/CD, CRUD, MVC, MVVM, Hooks, middleware, debounce, throttle, memoization, polyfill, shim
代码、变量名、函数名、类名、文件路径、URL、命令行、正则表达式保持原样不翻译
只翻译自然语言文本和代码注释
保持原文的语气和风格（教程/参考文档/API说明）
【输出格式】
对每个翻译单元，严格按以下格式输出，每行一个单元：
UNIT_ID|||译文内容`;
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
   * 执行批量翻译
   * @returns 只返回有译文的单元，翻译失败的跳过
   */
  async translate(request) {
    if (!this.apiKey) {
      throw new Error("DeepSeek API Key 未配置");
    }
    if (request.units.length === 0) return [];
    const userContent = this.buildUserContent(request);
    const body = JSON.stringify({
      model: DEEPSEEK_API_CONFIG.model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent }
      ],
      temperature: DEEPSEEK_API_CONFIG.temperature,
      max_tokens: DEEPSEEK_API_CONFIG.max_tokens
    });
    const rawResponse = await this.fetchWithRetry(body);
    return this.parseResponse(rawResponse, request);
  }
  /**
   * 构建用户消息内容：将翻译单元格式化发送
   */
  buildUserContent(request) {
    const lines = request.units.map((unit, index) => {
      const ctx = unit.contextChain.length > 0 ? ` [上下文: ${unit.contextChain.join(" > ")}]` : "";
      return `[${index}] ID:${unit.id}${ctx}
${unit.text}`;
    });
    return lines.join("\n\n");
  }
  /**
   * 带指数退避重试的 fetch 请求
   */
  async fetchWithRetry(body) {
    let lastError = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          DEEPSEEK_API_CONFIG.timeout
        );
        const response = await fetch(
          `${DEEPSEEK_API_CONFIG.baseURL}/chat/completions`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${this.apiKey}`
            },
            body,
            signal: controller.signal
          }
        );
        clearTimeout(timeoutId);
        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          throw new Error(
            `DeepSeek API 返回错误 ${response.status}: ${errorText.slice(0, 200)}`
          );
        }
        const data = await response.json();
        return data.choices?.[0]?.message?.content ?? "";
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
  /**
   * 解析 API 响应：按 UNIT_ID|||译文 格式拆解
   */
  parseResponse(raw, request) {
    const resultMap = /* @__PURE__ */ new Map();
    const lines = raw.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const parts = trimmed.split("|||");
      if (parts.length < 2) continue;
      const unitId = parts[0].trim();
      const translatedText = parts.slice(1).join("|||").trim();
      if (unitId && translatedText) {
        resultMap.set(unitId, translatedText);
      }
    }
    return request.units.filter((u) => resultMap.has(u.id)).map((u) => ({
      id: u.id,
      translatedText: resultMap.get(u.id),
      originalUnit: null
    }));
  }
  /**
   * 延迟工具函数
   */
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
    handleMessage(message, sender).then((result) => sendResponse(result)).catch((err) => {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("[DocBridge] 消息处理失败:", errorMsg);
      sendResponse({ error: errorMsg });
    });
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
      const { units, glossary, targetLang } = message.payload;
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
      if (uncached.length > 0 && translateProvider) {
        const request = {
          units: uncached,
          glossary,
          targetLang
        };
        const translated = await translateProvider.translate(request);
        for (const t of translated) {
          const original = uncached.find((u) => u.id === t.id);
          if (original) {
            const hash = await simpleHash(original.text);
            await setCache(hash, t.translatedText);
          }
          cached.push({ id: t.id, translatedText: t.translatedText });
        }
      }
      if (sender.tab?.id != null) {
        await chrome.tabs.sendMessage(sender.tab.id, {
          type: "TRANSLATE_RESULT",
          payload: { results: cached }
        });
      }
      return { success: true, cached: cached.length, total: units.length };
    }
    case "TOGGLE_DISPLAY": {
      const { mode } = message.payload;
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (tab.id == null) continue;
        try {
          await chrome.tabs.sendMessage(tab.id, {
            type: "TOGGLE_DISPLAY",
            payload: { mode }
          });
        } catch {
        }
      }
      return { success: true, mode };
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
