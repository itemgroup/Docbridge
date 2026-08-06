// src/background/provider/deepseek.ts — DeepSeek 翻译提供商 | DocBridge | 2025-08-06

import type { TranslationProvider, TranslationRequest, TranslatedUnit } from '../../shared/types';
import { DEEPSEEK_API_CONFIG, MAX_RETRIES, RETRY_BASE_DELAY_MS } from '../../shared/constants';

/** 翻译系统提示词 */
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

/**
 * DeepSeek 翻译提供商
 * 通过 fetch 调用 DeepSeek Chat API，支持指数退避重试
 */
export class DeepSeekProvider implements TranslationProvider {
  readonly name = 'deepseek';
  readonly maxBatchSize = 20;
  readonly supportsContext = true;

  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /** 更新 API Key */
  setApiKey(key: string): void {
    this.apiKey = key;
  }

  /**
   * 执行批量翻译
   * @returns 只返回有译文的单元，翻译失败的跳过
   */
  async translate(request: TranslationRequest): Promise<TranslatedUnit[]> {
    if (!this.apiKey) {
      throw new Error('DeepSeek API Key 未配置');
    }
    if (request.units.length === 0) return [];

    const userContent = this.buildUserContent(request);
    const body = JSON.stringify({
      model: DEEPSEEK_API_CONFIG.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      temperature: DEEPSEEK_API_CONFIG.temperature,
      max_tokens: DEEPSEEK_API_CONFIG.max_tokens,
    });

    const rawResponse = await this.fetchWithRetry(body);
    return this.parseResponse(rawResponse, request);
  }

  /**
   * 构建用户消息内容：将翻译单元格式化发送
   */
  private buildUserContent(request: TranslationRequest): string {
    const lines = request.units.map((unit, index) => {
      const ctx = unit.contextChain.length > 0
        ? ` [上下文: ${unit.contextChain.join(' > ')}]`
        : '';
      return `[${index}] ID:${unit.id}${ctx}\n${unit.text}`;
    });
    return lines.join('\n\n');
  }

  /**
   * 带指数退避重试的 fetch 请求
   */
  private async fetchWithRetry(body: string): Promise<string> {
    let lastError: Error | null = null;

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
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${this.apiKey}`,
            },
            body,
            signal: controller.signal,
          }
        );
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          throw new Error(
            `DeepSeek API 返回错误 ${response.status}: ${errorText.slice(0, 200)}`
          );
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content ?? '';
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        // 如果是 abort 导致的超时或其他错误，且还有重试次数
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

    throw lastError ?? new Error('DeepSeek 请求失败：未知错误');
  }

  /**
   * 解析 API 响应：按 UNIT_ID|||译文 格式拆解
   */
  private parseResponse(
    raw: string,
    request: TranslationRequest
  ): TranslatedUnit[] {
    const resultMap = new Map<string, string>();
    const lines = raw.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const parts = trimmed.split('|||');
      if (parts.length < 2) continue;
      const unitId = parts[0].trim();
      const translatedText = parts.slice(1).join('|||').trim();
      if (unitId && translatedText) {
        resultMap.set(unitId, translatedText);
      }
    }

    // 只返回成功解析的单元，丢失的跳过（下次重新翻译）
    return request.units
      .filter((u) => resultMap.has(u.id))
      .map((u) => ({
        id: u.id,
        translatedText: resultMap.get(u.id)!,
        originalUnit: {
          id: u.id,
          type: 'paragraph',
          element: document.createElement('div'),
          originalText: u.text,
          htmlContext: '',
          contextChain: u.contextChain,
          isInShadowDOM: false,
          isInIframe: false,
          priority: 5,
        },
      }));
  }

  /**
   * 延迟工具函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
