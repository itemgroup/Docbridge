// 翻译单元构建器 | 上下文链分析与批次优化
import type { TranslationUnit } from '../../shared/types';
import { MAX_BATCH_SIZE } from '../../shared/constants';

/**
 * 根据上下文链构建翻译批次
 * - 过滤无效/空单元
 * - 按可见性优先级降序排序
 * - 同章节文本合并至同一批次
 * - 输出二维批次数组供翻译队列使用
 *
 * @param units - 扫描器输出的翻译单元数组
 * @returns 二维批次数组
 */
export function buildBatches(units: TranslationUnit[]): TranslationUnit[][] {
  // 1. 过滤无效单元
  const valid = filterValidUnits(units);

  if (valid.length === 0) return [];

  // 2. 按优先级降序排序（视口内优先）
  const sorted = sortByPriority(valid);

  // 3. 按章节分组
  const chapters = groupByChapter(sorted);

  // 4. 将各组拆分为固定大小的批次
  const batches = createBatches(chapters);

  return batches;
}

/**
 * 过滤有效翻译单元
 * - 排除空文本
 * - 排除已翻译标记
 * - 排除纯空白
 */
function filterValidUnits(units: TranslationUnit[]): TranslationUnit[] {
  return units.filter((unit) => {
    if (!unit.originalText || unit.originalText.trim().length === 0) return false;
    if (unit.element.hasAttribute('data-dt-translated')) return false;
    return true;
  });
}

/**
 * 按优先级降序排序（视口内元素优先）
 */
function sortByPriority(units: TranslationUnit[]): TranslationUnit[] {
  return [...units].sort((a, b) => b.priority - a.priority);
}

/**
 * 按章节上下文分组
 * 通过 contextChain 的前缀判断是否属于同一章节
 */
function groupByChapter(units: TranslationUnit[]): TranslationUnit[][] {
  const groups: TranslationUnit[][] = [];
  let currentGroup: TranslationUnit[] = [];
  let currentChapterKey = '';

  for (const unit of units) {
    const chapterKey = getChapterKey(unit);

    // 新章节开始
    if (chapterKey !== currentChapterKey) {
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }
      currentGroup = [unit];
      currentChapterKey = chapterKey;
    } else {
      currentGroup.push(unit);
    }
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

/**
 * 获取章节键（基于 contextChain）
 */
function getChapterKey(unit: TranslationUnit): string {
  if (unit.contextChain.length > 0) {
    return unit.contextChain[0];
  }
  return '__root__';
}

/**
 * 将章节组拆分为固定大小的批次
 * 同章节的文本尽量放在同一批次中
 */
function createBatches(chapters: TranslationUnit[][]): TranslationUnit[][] {
  const batches: TranslationUnit[][] = [];
  let currentBatch: TranslationUnit[] = [];

  for (const chapter of chapters) {
    for (const unit of chapter) {
      currentBatch.push(unit);

      if (currentBatch.length >= MAX_BATCH_SIZE) {
        batches.push(currentBatch);
        currentBatch = [];
      }
    }

    // 章节结束时，如果当前批次不为空且下一个章节会导致超出，先提交
    if (currentBatch.length > 0 && currentBatch.length >= MAX_BATCH_SIZE / 2) {
      batches.push(currentBatch);
      currentBatch = [];
    }
  }

  // 提交最后一个不完整的批次
  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}

/**
 * 从翻译单元提取请求格式
 */
export function extractRequestData(units: TranslationUnit[]): Array<{
  id: string;
  text: string;
  contextChain: string[];
}> {
  return units.map((unit) => ({
    id: unit.id,
    text: unit.originalText,
    contextChain: unit.contextChain,
  }));
}
