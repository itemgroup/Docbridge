// src/content/analyzer/unit-builder.ts — 翻译单元构建：上下文链、排序、分批 | DocBridge | 2025-08-06

import type { TranslationUnit } from '../../shared/types';

/** 前文摘要最大长度 */
const CONTEXT_PREVIEW_LENGTH = 50;

/** 批次最大单元数（DeepSeek 最大支持 20） */
const BATCH_SIZE = 20;

export class UnitBuilder {
  /**
   * 接收 DOMScanner 产出的 TranslationUnit[]，进行上下文增强、过滤、排序和分批
   * @returns 按批次分组的 TranslationUnit[][]
   */
  build(units: TranslationUnit[]): TranslationUnit[][] {
    // 1. 过滤：去空白、去已被标记翻译完成的
    const filtered = units.filter((u) => {
      if (u.originalText.trim().length === 0) return false;
      if (u.element.hasAttribute('data-dt-translated')) return false;
      return true;
    });

    // 2. 按 priority 降序排序（高优先级先翻译）
    filtered.sort((a, b) => b.priority - a.priority);

    // 3. 为每个单元重建 contextChain
    for (const unit of filtered) {
      unit.contextChain = this.buildContextChain(unit, filtered);
    }

    // 4. 分组：按所属 heading 聚合，同 heading 尽量同批次
    return this.groupIntoBatches(filtered);
  }

  /**
   * 构建上下文链：[章节标题, 前文摘要1, 前文摘要2]
   */
  private buildContextChain(
    unit: TranslationUnit,
    allUnits: TranslationUnit[]
  ): string[] {
    const chain: string[] = [];

    // 查找章节标题：向上遍历 DOM 找最近的 h1-h6
    const heading = this.findHeadingForUnit(unit);
    if (heading) {
      chain.push(heading);
    }

    // 收集同父元素下的前 2 个相邻单元的摘要
    const siblingContexts = this.getSiblingContexts(unit, allUnits);
    for (const ctx of siblingContexts) {
      chain.push(this.truncate(ctx, CONTEXT_PREVIEW_LENGTH));
    }

    return chain;
  }

  /**
   * 向上查找单元对应的最近标题
   */
  private findHeadingForUnit(unit: TranslationUnit): string | null {
    let el: HTMLElement | null = unit.element.parentElement;
    while (el) {
      if (/^H[1-6]$/.test(el.tagName)) {
        return (el.textContent ?? '').replace(/\s+/g, ' ').trim();
      }
      el = el.parentElement;
    }
    return null;
  }

  /**
   * 获取同父元素下该单元之前的最近两个相邻单元的 originalText
   */
  private getSiblingContexts(
    unit: TranslationUnit,
    allUnits: TranslationUnit[]
  ): string[] {
    const parent = unit.element.parentElement;
    if (!parent) return [];

    // 筛选出同父元素下的所有单元
    const siblings = allUnits.filter(
      (u) => u.element.parentElement === parent && u.id !== unit.id
    );

    // 在父元素的子节点中找到当前 unit 的位置，确定前文
    const children = Array.from(parent.children);
    const currentIndex = children.indexOf(unit.element);
    if (currentIndex === -1) return [];

    // 收集 unit 之前最近的 2 个同级单元
    const beforeSiblings = siblings.filter((u) => {
      const idx = children.indexOf(u.element);
      return idx !== -1 && idx < currentIndex;
    });

    // 按 DOM 位置排序，取最近的 2 个
    beforeSiblings.sort((a, b) => {
      return children.indexOf(b.element) - children.indexOf(a.element);
    });

    return beforeSiblings.slice(0, 2).map((u) => u.originalText);
  }

  /**
   * 截断文本到指定长度
   */
  private truncate(text: string, maxLen: number): string {
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen) + '...';
  }

  /**
   * 按批次分组：同 heading 的单元尽量同批次，每批不超过 BATCH_SIZE
   * 使用 heading + 元素位置作为分组键，避免同名标题（如 "Overview"）被合并
   */
  private groupIntoBatches(units: TranslationUnit[]): TranslationUnit[][] {
    if (units.length === 0) return [];

    const batches: TranslationUnit[][] = [];
    let currentBatch: TranslationUnit[] = [];
    let currentHeading = '';

    // 按顺序遍历，同 heading 的连续单元尽量合并到同一批次
    for (const unit of units) {
      const heading = unit.contextChain[0] ?? '';
      // heading 变化时开始新批次（如果当前批次已有内容）
      if (heading !== currentHeading && currentBatch.length > 0) {
        batches.push(currentBatch);
        currentBatch = [];
      }
      currentHeading = heading;
      currentBatch.push(unit);
      // 达到批次上限则切分
      if (currentBatch.length >= BATCH_SIZE) {
        batches.push(currentBatch);
        currentBatch = [];
      }
    }

    if (currentBatch.length > 0) {
      batches.push(currentBatch);
    }

    return batches;
  }
}
