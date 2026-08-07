# DocBridge

基于 AI 的 Chrome 浏览器扩展，将英文技术文档翻译为中文——不破坏原始网页结构。

## 功能特性

| 功能 | 说明 |
|------|------|
| **零侵入 DOM** | 译文作为新节点插入原文下方，原始 class/id/style/事件监听器永不修改 |
| **链接防撕裂** | `<a>` 超链接通过 `{{TAG_N}}` 占位符保护，LLM 不接触链接文本，翻译后链接完整可点击 |
| **行内代码保留** | 段落中的 `<code>--pipeline_type LM</code>` 等行内代码片段原样保留在译文对应位置 |
| **块级代码跳过** | `<pre><code>` 包裹的代码块通过 `FILTER_REJECT` 整棵子树跳过，完全不翻译 |
| **智能句子合并** | 被 `<span>`、`<em>` 等行内元素打断的句子，通过向上查找块级祖先归并到同一个翻译单元 |
| **SPA 增量翻译** | `MutationObserver` 监听 DOM 变化，页面动态加载的内容自动增量翻译 |
| **双语对照显示** | 三种模式：双语对照 / 仅译文 / 仅原文，一键切换 |
| **悬浮进度条** | 页面底部固定进度指示器，显示已完成/总数，单例复用不闪烁，完成后自动消失 |
| **翻译缓存** | 基于 IndexedDB（Dexie.js v4）的翻译缓存，已翻译页面秒开 |

## 技术栈

| 层级 | 技术 |
|------|------|
| 平台 | Chrome Extension Manifest V3 |
| 语言 | TypeScript（strict 严格模式，禁用 `any`） |
| 构建 | Vite（多入口）+ 自定义 IIFE 构建脚本 |
| 存储 | `chrome.storage.local` + IndexedDB（Dexie.js v4） |
| 翻译 API | DeepSeek（`deepseek-chat` 模型，通过 `fetch` 调用） |
| 测试 | Vitest |
| 样式 | 原生 CSS（不引入 React/Vue/Tailwind，扩展体积 < 2MB） |

## 项目结构

```
docbridge/
├── manifest.json
├── package.json
├── vite.config.ts
├── tsconfig.json
├── scripts/
│   └── build.mjs              # 自定义多入口 IIFE 构建脚本
├── src/
│   ├── shared/
│   │   ├── types.ts            # 全局类型定义（核心契约）
│   │   ├── constants.ts        # 常量、API 配置、系统提示词
│   │   └── storage/
│   │       └── indexeddb.ts    # Dexie.js IndexedDB 封装
│   ├── background/
│   │   ├── index.ts            # Service Worker：消息路由、缓存管理
│   │   └── provider/
│   │       └── deepseek.ts     # DeepSeek API 客户端
│   ├── content/
│   │   ├── index.ts            # 内容脚本入口：翻译全流程组装
│   │   ├── scanner/
│   │   │   └── dom-scanner.ts  # 基于 TreeWalker 的 DOM 扫描 + 占位符序列化
│   │   ├── analyzer/
│   │   │   └── unit-builder.ts # 翻译单元批处理 + 优先级排序
│   │   ├── translator/
│   │   │   └── translation-queue.ts  # 滑动窗口并发翻译队列
│   │   ├── renderer/
│   │   │   └── dom-renderer.ts # 零侵入 DOM 渲染 + {{TAG_N}} 占位符回填
│   │   └── ui/
│   │       └── progress-bar.ts # 页面底部悬浮进度条（单例复用）
│   ├── popup/
│   │   ├── index.html
│   │   ├── index.ts
│   │   └── popup.css
│   └── options/
│       ├── index.html
│       ├── index.ts
│       └── options.css
└── dist/                       # 构建输出（Chrome 扩展加载此目录）
```

## 快速开始

### 环境要求

- Node.js 18+
- Chrome / Edge（Chromium 内核）

### 安装依赖

```bash
npm install
```

### 构建

```bash
# 清理 + 构建（推荐）
npm run build:clean

# 仅构建（不清理 dist/）
npm run build
```

### 加载到 Chrome

1. 打开 `chrome://extensions`
2. 开启右上角 **开发者模式**
3. 点击 **加载已解压的扩展程序**
4. 选择项目的 `dist/` 目录（注意：不是 `src/` 目录）

### 配置

1. 右键点击扩展图标 → **选项**
2. 填入 [DeepSeek API Key](https://platform.deepseek.com/)
3. （可选）配置术语表、显示模式等

## 工作原理

### 翻译管线

```
网页正文内容
    │
    ▼
DOM 扫描器（TreeWalker）
    │  • 跳过导航/侧边栏/页脚/广告区域
    │  • FILTER_REJECT 跳过 <pre> 代码块
    │  • 按块级祖先分组文本节点
    │
    ▼
占位符序列化
    │  • <a>/<code>/<sup>/<sub> → {{TAG_N}} 占位符
    │  • 递归展开行内子元素（穿透 <span>/<em>）
    │
    ▼
翻译队列（滑动窗口）
    │  • 最多 3 个并发请求
    │  • 指数退避重试（最多 3 次）
    │  • 单次请求 10s 超时
    │
    ▼
DOM 渲染器
    │  • 解析 LLM 返回文本中的 {{TAG_N}} 占位符
    │  • 通过 cloneNode(true) 深克隆原始 <a>/<code> 元素
    │  • 使用 createTextNode() 创建文本节点
    │  • 翻译管线零 innerHTML 使用
    │
    ▼
双语对照显示
       • 原文 DOM 结构完全不变
       • 译文追加为 <span class="dt-bridge"> 兄弟节点
       • CSS 切换双语/仅译文/仅原文三种显示模式
```

### 占位符协议

`{{TAG_N}}` 占位符是保护行内元素不被 LLM 破坏的核心机制：

| 元素 | 占位符 | LLM 看到的 | 渲染器处理 |
|------|--------|-----------|-----------|
| `<a href="/docs">文档</a>` | `{{TAG_0}}` | `{{TAG_0}}`（纯占位符） | `cloneNode(true)` → 完整保留链接 |
| `<code>--flag</code>`（行内） | `{{TAG_1}}` | `{{TAG_1}}`（纯占位符） | `cloneNode(true)` → 代码原样保留 |
| `<pre><code>...</code></pre>` | 跳过 | 不会发给 LLM | FILTER_REJECT 整棵子树 |

LLM 系统提示词明确要求：`【强制】{{TAG_N}}占位符(链接或代码)原样保留不译`

### 关键设计决策

- **块级 vs 行内切割**：只有块级元素（`p`/`div`/`li`/`h1-h6` 等）才切割翻译单元边界；`span`/`em`/`strong` 等行内容器不切割，递归深挖确保同一句子归入一个翻译单元
- **单例进度条**：进度条全局仅一个实例，新任务到来时复用已有 DOM，取消销毁定时器，不闪烁不重复创建
- **Observer 缓存队列**：翻译进行中，MutationObserver 仍收集新增节点到 `pendingNewNodes`，等当前轮完成后再消费，避免翻译期间丢失增量内容
- **防重入锁**：`isTranslating` + `isLocked` 双重布尔锁，防止 Observer 和手动翻译并发冲突

## NPM 脚本

```json
{
  "clean": "node -e \"require('fs').rmSync('dist', {recursive:true, force:true})\"",
  "build": "node scripts/build.mjs",
  "build:clean": "npm run clean && npm run build",
  "dev": "node scripts/build.mjs"
}
```

## 开发规范

- 字符串使用单引号，缩进 2 空格
- 函数不超过 50 行，超过必须拆分
- 所有导出函数必须有 JSDoc 注释
- 禁止使用 `any`，所有类型必须显式定义
- 异步操作必须有 `try/catch`，网络请求必须有超时
- 每次只改一个模块，修改后必须运行 `npm run build` 验证

## 许可证

MIT
