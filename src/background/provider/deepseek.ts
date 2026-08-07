// DeepSeek 翻译提供商 | 网络请求层（仅 background 使用）
import type { DeepSeekRequest, DeepSeekResponse, TranslatedUnit, TranslationRequest } from '../../shared/types';
import { DEFAULT_API_BASE_URL, DEFAULT_MODEL, TRANSLATION_TEMPERATURE, MAX_TOKENS, REQUEST_TIMEOUT_MS, MAX_RETRIES, RETRY_BASE_DELAY_MS, TRANSLATION_SYSTEM_PROMPT, TRANSLATION_SEPARATOR } from '../../shared/constants';
import { CacheManager } from '../../shared/storage/indexeddb';

export class DeepSeekProvider {
  readonly name = 'deepseek';
  readonly maxBatchSize = 50;
  readonly supportsContext = true;

  private apiKey: string = '';
  private baseURL: string = DEFAULT_API_BASE_URL;

  /**
   * 从 chrome.storage 加载 API 配置
   */
  async loadConfig(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['apiKey', 'apiBaseURL']);
      this.apiKey = result.apiKey || '';
      this.baseURL = result.apiBaseURL || DEFAULT_API_BASE_URL;
    } catch (error) {
      console.error('[DocBridge DeepSeek] 加载配置失败:', error);
    }
  }

  /**
   * 计算字符串的简单哈希
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return 'h' + Math.abs(hash).toString(16);
  }

  /**
   * 执行翻译请求
   */
  async translate(request: TranslationRequest): Promise<TranslatedUnit[]> {
    await this.loadConfig();

    if (!this.apiKey) {
      throw new Error('API Key 未配置，请在设置页面配置 DeepSeek API Key');
    }

    // 1. 查询本地缓存，命中则直接返回
    const cachedUnits: TranslatedUnit[] = [];
    const uncachedUnits: TranslationRequest['units'] = [];

    for (const unit of request.units) {
      const hash = this.hashString(unit.text);
      const cached = await CacheManager.getCache(hash);
      if (cached) {
        const originalUnit = {
          id: unit.id,
          type: 'paragraph' as const,
          element: null as unknown as HTMLElement,
          originalText: unit.text,
          htmlContext: '',
          contextChain: unit.contextChain,
          isInShadowDOM: false,
          isInIframe: false,
          priority: 0,
        };
        cachedUnits.push({
          id: unit.id,
          translatedText: cached.translatedText,
          originalUnit,
        });
      } else {
        uncachedUnits.push(unit);
      }
    }

    if (uncachedUnits.length === 0) {
      return cachedUnits;
    }

    // 2. 构建用户消息
    const userContent = uncachedUnits
      .map((u) => `${u.id}${TRANSLATION_SEPARATOR}${u.text}`)
      .join('\n\n');

    // 3. 构建请求体
    const reqBody: DeepSeekRequest = {
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: TRANSLATION_SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      temperature: TRANSLATION_TEMPERATURE,
      max_tokens: MAX_TOKENS,
    };

    // 4. 带指数退避重试的 fetch
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        const response = await fetch(`${this.baseURL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(reqBody),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // 处理 HTTP 错误
        if (response.status === 401) {
          throw new Error('API Key 无效，请检查设置');
        }
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
          console.warn(`[DocBridge DeepSeek] 429 限流，${delay}ms 后重试 (${attempt + 1}/${MAX_RETRIES})`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(`API 请求失败 (${response.status}): ${errorText}`);
        }

        const data: DeepSeekResponse = await response.json();

        // 5. 解析响应
        const content = data.choices?.[0]?.message?.content;
        if (!content) {
          throw new Error('API 返回内容为空');
        }

        const parsed = this.parseResponse(content);
        const resultMap = new Map(parsed.map((p) => [p.id, p.translatedText]));

        // 6. 构建 TranslatedUnit 数组
        const results: TranslatedUnit[] = [];
        for (const unit of uncachedUnits) {
          const translatedText = resultMap.get(unit.id) || unit.text;
          const originalUnit = {
            id: unit.id,
            type: 'paragraph' as const,
            element: null as unknown as HTMLElement,
            originalText: unit.text,
            htmlContext: '',
            contextChain: unit.contextChain,
            isInShadowDOM: false,
            isInIframe: false,
            priority: 0,
          };
          results.push({ id: unit.id, translatedText, originalUnit });

          // 写入缓存
          const hash = this.hashString(unit.text);
          CacheManager.setCache(hash, translatedText, this.name).catch(() => {});
        }

        return [...cachedUnits, ...results];
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn(`[DocBridge DeepSeek] 请求超时 (${attempt + 1}/${MAX_RETRIES})`);
        } else {
          console.error(`[DocBridge DeepSeek] 请求失败 (${attempt + 1}/${MAX_RETRIES}):`, lastError.message);
        }
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    throw lastError || new Error('翻译请求失败');
  }

  /**
   * 解析 API 响应文本，提取 UNIT_ID|||译文 格式
   */
  private parseResponse(content: string): Array<{ id: string; translatedText: string }> {
    const results: Array<{ id: string; translatedText: string }> = [];
    const lines = content.split('\n').filter((l) => l.trim());

    for (const line of lines) {
      const separatorIndex = line.indexOf(TRANSLATION_SEPARATOR);
      if (separatorIndex === -1) continue;

      const id = line.substring(0, separatorIndex).trim();
      const translatedText = line.substring(separatorIndex + TRANSLATION_SEPARATOR.length).trim();

      if (id && translatedText) {
        results.push({ id, translatedText });
      }
    }

    return results;
  }
}

/** 单例 */
export const deepseekProvider = new DeepSeekProvider();
