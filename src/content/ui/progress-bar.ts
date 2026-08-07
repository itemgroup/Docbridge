// 翻译进度条 UI | 页面底部悬浮，全 inline 样式，单例不重复创建

const PROGRESS_BAR_ID = 'dt-progress-bar';
/** 进度条 DOM 引用（全局唯一实例） */
let barRef: HTMLElement | null = null;
/** 销毁定时器 ID（新任务到来时取消） */
let destroyTimerId: ReturnType<typeof setTimeout> | null = null;

/**
 * 初始化进度条（单例复用）
 * - 已存在：取消销毁定时器，重置为 0/total，不新建 DOM
 * - 不存在：创建新 DOM 追加到 body
 * - total <= 0：不渲染
 */
export function initProgressBar(total: number): void {
  if (total <= 0) return;

  // 新任务到来 → 取消即将执行的销毁动作
  if (destroyTimerId) {
    clearTimeout(destroyTimerId);
    destroyTimerId = null;
  }

  // 复用已有 DOM
  const existing = document.getElementById(PROGRESS_BAR_ID);
  if (existing) {
    barRef = existing;
    const fill = document.getElementById('dt-progress-fill');
    if (fill) fill.style.width = '0%';
    const label = document.getElementById('dt-progress-label');
    if (label) label.textContent = `翻译中 0% (0/${total})`;
    return;
  }

  // 新建 DOM
  const bar = document.createElement('div');
  bar.id = PROGRESS_BAR_ID;
  bar.style.cssText =
    'position:fixed;bottom:0;left:0;right:0;z-index:99999;' +
    'height:28px;display:flex;align-items:center;' +
    'font-family:sans-serif;font-size:12px;color:#fff;' +
    'pointer-events:none;';

  const track = document.createElement('div');
  track.style.cssText =
    'position:absolute;top:0;left:0;right:0;bottom:0;' +
    'background:rgba(0,0,0,0.7);';

  const fill = document.createElement('div');
  fill.id = 'dt-progress-fill';
  fill.style.cssText =
    'position:absolute;top:0;left:0;bottom:0;' +
    'width:0%;background:#1890ff;transition:width 0.3s ease;';

  const label = document.createElement('span');
  label.id = 'dt-progress-label';
  label.style.cssText =
    'position:relative;z-index:1;padding:0 12px;white-space:nowrap;';
  label.textContent = `翻译中 0% (0/${total})`;

  bar.appendChild(track);
  bar.appendChild(fill);
  bar.appendChild(label);
  document.body.appendChild(bar);
  barRef = bar;
}

/**
 * 更新进度百分比和文字
 * 失败任务也计入 finished，防止进度卡死
 */
export function updateTranslateProgress(finished: number, total: number): void {
  const bar = document.getElementById(PROGRESS_BAR_ID);
  if (!bar || total <= 0) return;

  const percent = Math.min(100, Math.round((finished / total) * 100));

  const fill = document.getElementById('dt-progress-fill');
  if (fill) fill.style.width = `${percent}%`;

  const label = document.getElementById('dt-progress-label');
  if (label) {
    label.textContent = `翻译中 ${percent}% (${finished}/${total})`;
  }
}

/**
 * 销毁进度条
 * delayMs > 0：延迟销毁（翻译完成时短留 1.2s 显示 100%）
 * delayMs = 0：立即销毁
 *
 * 新任务到来时 initProgressBar 会自动取消这里的定时器
 */
export function destroyProgressBar(delayMs = 0): void {
  if (destroyTimerId) clearTimeout(destroyTimerId);
  destroyTimerId = null;

  const remove = (): void => {
    const bar = document.getElementById(PROGRESS_BAR_ID);
    if (bar) bar.remove();
    barRef = null;
    destroyTimerId = null;
  };

  if (delayMs > 0) {
    destroyTimerId = setTimeout(remove, delayMs);
  } else {
    remove();
  }
}
