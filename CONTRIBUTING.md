# 贡献指南

感谢关注本刷题系统！无论是报一个题目错误、提一个功能建议，还是直接提交代码，都欢迎。线上地址：<https://bank.635262140.xyz>。

## 报告 Issue

提 issue 前请先搜索已有 issue，避免重复。请按类型提供以下信息：

- **🐛 网站 bug**：浏览器与系统版本、复现步骤、截图/控制台报错
- **📝 题目内容错误**：科目 + 完整题干 + 你认为正确的答案及依据
  （题库数据由爬虫仓库维护，前端只负责展示——issue 里说清楚即可，维护者会流转到数据仓库修正）
- **💡 功能建议**：描述你的使用场景，而不仅是想要的方案

## 本地开发

```bash
pnpm install   # 安装依赖
pnpm dev       # 启动开发服务器 localhost:5173
pnpm test      # 运行单元测试（vitest）
pnpm build     # 生产构建
```

环境要求：Node ≥ 20、pnpm ≥ 10（CI 使用 Node 22 + pnpm 10）。零配置即可启动——题库数据运行时从线上拉取，无需本地环境变量。

## 提交 PR

1. 从 `main` 拉新分支，命名 `type/简短英文描述`，如 `feat/exam-timer`、`fix/pdf-export`
2. 提交信息格式：`type: 中文描述`，如 `fix: 修复收藏夹导入丢失标记的问题`
3. 确保本地 `pnpm test` 与 `pnpm build` 通过——CI 会对每个 PR 跑同样的三步（install → test → build），红灯会被拦截
4. 涉及 UI 的改动请在 PR 里附截图/录屏
5. 所有变更一律通过 PR 合并，不直接 push 到 `main`

## 代码约定

- Options API 与 `<script setup>` 混合使用，跟随所在文件的既有风格即可，不必整文件改写
- 样式使用 SCSS；Element Plus 组件的深度样式覆盖用 `:deep()`
- 注释以中文为主，解释「为什么」而非复述代码
- 新增工具函数放 `src/utils/`，并尽量在 `tests/` 配套测试（参考 `quizGenerator.spec.js`）

## 项目组成

本系统由三个仓库组成，改哪部分就去对应的仓库：

| 仓库 | 职责 |
|---|---|
| [crawlerVisualization](https://github.com/fgh23333/crawlerVisualization)（本仓库） | 前端界面与交互 |
| [crawler](https://github.com/fgh23333/crawler) | 题库爬虫与数据生产（题目内容的修正在这里） |
| [rag-ai-tutorial](https://github.com/fgh23333/rag-ai-tutorial) | AI 问答后端（Cloudflare Worker + RAG） |

## 安全

请勿在任何 issue、PR 或代码中提交 API 密钥、token、学号等敏感信息。
