import { defineConfig } from 'vitest/config'

// 回归测试配置：纯逻辑工具层（题库加载/组卷/题型判断/收藏同步）
// happy-dom 提供 localStorage / fetch / Blob / File 等浏览器 API
export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.spec.js'],
  },
})
