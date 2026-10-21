import { defineConfig } from 'vitest/config'
import path from 'path'

// 回归测试配置：纯逻辑工具层（题库加载/组卷/题型判断/收藏同步/端侧 AI store）
// happy-dom 提供 localStorage / fetch / Blob / File 等浏览器 API
// 注意：vitest.config.js 存在时 vite.config.js 整个被忽略，@ 别名需在此重复声明
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.spec.js'],
  },
})
