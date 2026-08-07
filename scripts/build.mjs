// DocBridge 构建脚本 | 独立 IIFE 构建每个入口
// 解决多入口 + IIFE 格式的代码分割冲突问题

import { build } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { rmSync, cpSync, existsSync, mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const distDir = resolve(root, 'dist');

const entries = [
  { name: 'background', input: resolve(root, 'src/background/index.ts') },
  { name: 'content', input: resolve(root, 'src/content/index.ts') },
  { name: 'popup', input: resolve(root, 'src/popup/index.ts') },
  { name: 'options', input: resolve(root, 'src/options/index.ts') },
];

async function main() {
  // 清理 dist 目录
  rmSync(distDir, { recursive: true, force: true });
  mkdirSync(distDir, { recursive: true });

  for (let i = 0; i < entries.length; i++) {
    const { name, input } = entries[i];
    console.log(`[DocBridge] Building ${name}...`);

    await build({
      root,
      configFile: false,
      build: {
        outDir: distDir,
        emptyOutDir: false,
        rollupOptions: {
          input,
          output: {
            format: 'iife',
            entryFileNames: `${name}.js`,
          },
        },
        minify: false,
        sourcemap: false,
      },
    });

    console.log(`[DocBridge] ${name}.js built successfully.`);
  }

  // 复制静态文件
  copyStaticFiles();

  console.log('[DocBridge] All entries built successfully!');
}

function copyStaticFiles() {
  // 复制 manifest.json
  const manifestSrc = resolve(root, 'manifest.json');
  if (existsSync(manifestSrc)) {
    cpSync(manifestSrc, resolve(distDir, 'manifest.json'));
  }

  // 复制 popup HTML & CSS
  const popupDir = resolve(root, 'src/popup');
  if (existsSync(popupDir)) {
    cpSync(resolve(popupDir, 'index.html'), resolve(distDir, 'popup/index.html'), { force: true });
    cpSync(resolve(popupDir, 'popup.css'), resolve(distDir, 'popup/popup.css'), { force: true });
  }

  // 复制 options HTML & CSS
  const optionsDir = resolve(root, 'src/options');
  if (existsSync(optionsDir)) {
    cpSync(resolve(optionsDir, 'index.html'), resolve(distDir, 'options/index.html'), { force: true });
    cpSync(resolve(optionsDir, 'options.css'), resolve(distDir, 'options/options.css'), { force: true });
  }

  // 复制 icons
  const iconsDir = resolve(root, 'icons');
  if (existsSync(iconsDir)) {
    const distIcons = resolve(distDir, 'icons');
    if (!existsSync(distIcons)) mkdirSync(distIcons, { recursive: true });
    cpSync(iconsDir, distIcons, { recursive: true, force: true });
  }

  console.log('[DocBridge] Static files copied.');
}

main().catch((err) => {
  console.error('[DocBridge] Build failed:', err);
  process.exit(1);
});
