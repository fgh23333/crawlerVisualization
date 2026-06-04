# CLAUDE.md — 项目指南

## 项目概述

政治理论课 + 计算机等级考试刷题系统。Vue 3 + Vite + Pinia + Element Plus 纯前端 SPA，无后端服务器。题库数据运行时从 Cloudflare R2 拉取（`VITE_DATA_URL`），支持热更新。

**线上地址**: https://bank.635262140.xyz

## 技术栈

- Vue 3（Composition + Options 混合）
- Vite 5 + SCSS（modern-compiler API）
- Pinia 2 + pinia-plugin-persistedstate（localStorage 持久化）
- Vue Router 4
- Element Plus + @element-plus/icons-vue
- lz-string（收藏夹导入导出压缩）、Fuse.js（模糊搜索）、pdfmake（PDF）、mermaid（UML 图）

## 开发命令

```bash
pnpm dev          # 启动开发服务器 localhost:5173
pnpm build        # 生产构建 → dist/
pnpm preview      # 本地预览生产构建
```

## 路由结构

| 路径 | 组件 | 说明 |
|---|---|---|
| `/` | HomeView.vue | 旧版入口（顶部导航栏） |
| `/newHome` | new/newHome.vue | **主入口**（侧边栏布局） |
| `/newHome/:type/:lesson` | questionList.vue → questionCard.vue | 题目列表 |
| `/newHome/favorites` | favorites.vue | 收藏夹/错题本 |
| `/newHome/exam/:lesson/:id` | examView.vue | 模拟考试 |
| `/newHome/chat` | chatView.vue | AI 对话 (Beta) |
| `/newHome/about` | about.vue | 关于页面 |
| `/newHome/feedback` | feedback.vue | 意见反馈 |
| `/ncre3` | ncre3Home.vue | 计算机三级题库 |
| `/computer-question` | computerQuestion.vue | 计算机组成原理题库 |

## 关键文件

### 组件
- `src/components/QuestionItem.vue` — 单题渲染组件（判断/填空/单选/多选），props + emit 模式
- `src/components/questionCard.vue` — 题目列表容器，处理筛选、搜索、快捷键、答案开关
- `src/components/modal.vue` — 首次访问弹窗（问卷征集）

### 状态管理
- `src/stores/question.js` — 思政题库：错题、收藏、标记、学习记录、导入导出
- `src/stores/ncre3.js` — 计算机三级题库状态
- `src/stores/computerQuestion.js` — 计算机组成原理题库状态

### 工具
- `src/utils/favoritesSync.js` — 收藏夹导入导出：encodeFavorites / decodeFavorites / mergeFavorites
- `src/utils/questionType.ts` — 题型判断函数 getQuestionType + TYPE_LABEL 映射
- `src/utils/loadJson.js` — 运行时题库加载，从 R2 远程拉取 + localStorage 缓存
- `src/utils/makePdf.js` — PDF 生成（含答案/无答案）
- `src/utils/quizGenerator.js` — 随机组卷

## 数据结构

### 题目对象
```js
{
  id: "1798736702152376321",      // 唯一 ID
  questionStem: "题目文本...",
  option: ["选项A", "选项B", ...], // 填空题为 []
  answer: "A" | "AB" | "正确",    // 答案
  abbreviationSubject: "Marx"      // 科目缩写
}
```

### 题型判断规则
- `option` 为空 → 填空题
- `option.length === 2` → 判断题
- `answer.length === 1` → 单选题
- `answer.length > 1` → 多选题

### 持久化字段（localStorage via Pinia）
- `wrongQuestions`、`likeList`、`markList` — 题目对象数组
- `userRecords` — `{ [questionId]: { questionId, errorCount, attempted, lastErrorDate } }`
- `viewed_*` — 已查看答案 ID 集合
- `viewed_*_showAll` — 答案全局开关状态

## 视口适配

`index.html` 内联 JS 根据 `screen.width` 动态设置 `initial-scale`：
- 手机 (<600px) → 0.5
- 平板 (600-1023px) → 0.75
- 桌面 (≥1024px) → 1.0

侧边栏在 <768px 时默认折叠（`window.innerWidth < 768`）。

## 科目列表

9 个思政科目：Marx（马原）、CMH（近代史）、Political（思政）、MaoIntro（毛概）、XiIntro（习概）、SDH（社主史）、NCH（新中国史）、CCPH（党史）、ORH（改开史）

## 环境变量

- `VITE_DATA_URL` — 生产环境题库 API 地址（`.env.production`）
- `/cdn-api` — 开发代理，指向计算机组成原理题库 CDN

## 编码约定

- 组件使用 Options API（`data/watch/methods`）和 Composition API（`<script setup>`）混合
- 样式用 SCSS，无 CSS Modules，外层用 `#id` 或 `.class` 作用域
- Element Plus 组件深度样式用 `:deep()` 穿透
- 中文注释为主
- Git commit 格式：`type: 中文描述`，PR 合并时用 `Co-Authored-By` trailer
