// src/background/provider/deepseek.ts — DeepSeek 翻译提供商 | DocBridge | 2025-08-06

import type { TranslationProvider, TranslationRequest, TranslatedUnit } from '../../shared/types';
import { DEEPSEEK_API_CONFIG, MAX_RETRIES, RETRY_BASE_DELAY_MS } from '../../shared/constants';

/** 翻译系统提示词 */
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

/**
 * DeepSeek 翻译提供商
 * 通过 fetch 调用 DeepSeek Chat API，支持超时和指数退避重试
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
   * 执行批量翻译（TranslationProvider 接口实现）
   */
  async translate(request: TranslationRequest): Promise<TranslatedUnit[]> {
    if (!this.apiKey) {
      throw new Error('DeepSeek API Key 未配置');
    }
    if (request.units.length === 0) return [];

    return this.translateBatch(request);
  }

  /**
   * 发送翻译请求到 DeepSeek API
   */
  private async translateBatch(request: TranslationRequest): Promise<TranslatedUnit[]> {
    console.log('[DeepSeek] 开始翻译，单元数:', request.units.length);

    const baseURL = DEEPSEEK_API_CONFIG.baseURL;

    const rawContent = await this.fetchWithRetry(
      `${baseURL}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: DEEPSEEK_API_CONFIG.model,
          temperature: DEEPSEEK_API_CONFIG.temperature,
          max_tokens: DEEPSEEK_API_CONFIG.max_tokens,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: this.buildPrompt(request) },
          ],
        }),
      }
    );

    console.log('[DeepSeek] API 原始返回:\n', rawContent.substring(0, 500));

    return this.parseResponse(rawContent, request.units);
  }

  /**
   * 构建发送给模型的用户消息
   */
  private buildPrompt(request: TranslationRequest): string {
    let prompt = '';
    request.units.forEach((unit) => {
      prompt += `ID:${unit.id}\n内容：${unit.text}\n\n`;
    });
    return prompt;
  }

  /**
   * 解析 API 返回内容：ID:xxx|||yyy 格式
   */
  private parseResponse(
    content: string,
    units: TranslationRequest['units']
  ): TranslatedUnit[] {
    const results: TranslatedUnit[] = [];
    const unitMap = new Map(units.map((u) => [u.id, u]));

    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // 匹配 ID:xxx|||yyy，xxx 为字母数字下划线，yyy 为任意内容
      const match = trimmed.match(/^ID:([a-zA-Z0-9_-]+)\|\|\|(.*)$/);
      if (!match) continue;

      const id = match[1];
      const translatedText = match[2].trim();

      const originalUnit = unitMap.get(id);
      if (originalUnit) {
        results.push({
          id,
          translatedText: translatedText || originalUnit.text,
          originalUnit: null,
        });
        unitMap.delete(id);
      }
    }

    // 未匹配到的单元保留原文，防止丢失
    for (const [, unit] of unitMap) {
      results.push({
        id: unit.id,
        translatedText: unit.text,
        originalUnit: null,
      });
    }

    console.log(
      '[DeepSeek] 解析结果:',
      results.map((r) => ({
        id: r.id,
        text: r.translatedText.substring(0, 40),
      }))
    );

    return results;
  }

  /**
   * 带超时和指数退避重试的 fetch 请求
   */
  private async fetchWithRetry(url: string, init: RequestInit): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          DEEPSEEK_API_CONFIG.timeout
        );

        const response = await fetch(url, { ...init, signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          throw new Error(`API ${response.status}: ${errorText.slice(0, 200)}`);
        }

        const data = await response.json();
        const content: string = data.choices?.[0]?.message?.content ?? '';
        return content;
      } catch (err: unknown) {
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

    throw lastError ?? new Error('DeepSeek 请求失败：未知错误');
  }

  /** 延迟工具函数 */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
