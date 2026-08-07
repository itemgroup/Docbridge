// DocBridge Vite 配置 | 多入口独立 IIFE 构建
import { defineConfig, type UserConfig } from 'vite';
import { resolve } from 'path';

/**
 * 每个入口独立构建为 IIFE 格式，解决 Chrome Extension content script
 * 的 "import outside module" 问题。
 */
const entries: Record<string, string> = {
  background: resolve(__dirname, 'src/background/index.ts'),
  content: resolve(__dirname, 'src/content/index.ts'),
  popup: resolve(__dirname, 'src/popup/index.ts'),
  options: resolve(__dirname, 'src/options/index.ts'),
};

export default defineConfig(({ command }) => {
  // 开发模式：单独指定入口
  const entryName = process.env.BUILD_ENTRY;
  
  if (entryName && entries[entryName]) {
    return {
      build: {
        outDir: 'dist',
        emptyOutDir: false,
        rollupOptions: {
          input: entries[entryName],
          output: {
            format: 'iife',
            entryFileNames: `${entryName}.js`,
          },
        },
        minify: false,
        sourcemap: false,
      },
    } as UserConfig;
  }

  // 默认：es 格式打包（内部测试用）
  return {
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: entries,
        output: {
          format: 'es',
          entryFileNames: '[name].js',
          chunkFileNames: 'chunks/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },
      minify: false,
      sourcemap: false,
    },
  } as UserConfig;
});
