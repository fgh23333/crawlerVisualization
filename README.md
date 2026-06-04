# Political Exam Practice System

一个基于 Vue 3 + Vite 的政治理论课刷题与模拟考试系统。旨在帮助学生高效复习各类政治理论课程，支持多种题型练习、模拟考试、错题回顾、收藏/标记，以及 AI 辅助学习。项目同时内置了**全国计算机等级考试三级**和**计算机组成原理**题库模块。

## ✨ 主要功能 (Features)

- **多科目支持**：涵盖马原、毛概、思修（思想道德与法治）、史纲、习概、改开史、新中国史、党史、社主史等多个政治理论科目。
- **多题库支持**：
  - **思政题库** — 政治理论课各科目
  - **计算机三级题库** — NCRE 三级网络技术 / 数据库技术
  - **计算机组成原理** — 计算机组成原理课程题库
- **全题型覆盖**：单选题、多选题、判断题、填空题
- **模拟考试 (Mock Exam)**：
  - 按试卷或章节练习
  - 自动评分与答题解析
  - 错题自动归入错题本
- **个性化学习**：
  - **错题本 (Wrong Questions)**：自动记录做错的题目，方便查漏补缺。
  - **收藏夹 (Favorites)**：题目右上角一键收藏 / 取消收藏，状态持久化到本地。
  - **标记 (Marks)**：与收藏并列的标记按钮，用于额外标注重点题；同样持久化。
  - **学习记录 (User Records)**：统计做题次数、错题次数与最近错题日期。
- **练习模式 (Practice Mode)**：逐题作答、即时反馈正误，错题自动收录。
- **键盘快捷键**：
  - `q` — 切换鼠标悬浮题目的答案
  - `0` — 切换当前题（顶端题）的答案
  - `-` / `=` — 上一题 / 下一题
- **跨设备同步**：
  - 导出收藏为压缩文本码（复制粘贴）或 JSON 文件
  - 导入时自动合并去重，支持文本码和文件两种方式
- **实用工具**：
  - **PDF 导出**：支持将试题列表导出为 PDF（含答案 / 无答案两种）或直接打印。
  - **一键显示答案**：顶部开关一键切换所有答案的显示/隐藏，状态跨页面持久化。
  - **AI 助手 (Beta)**：内置对话页面，辅助解答疑惑。
- **响应式视口**：根据屏幕宽度自动调整缩放比例，适配手机、平板、桌面设备。

## 🛠 技术栈 (Tech Stack)

- **核心框架**: [Vue 3](https://vuejs.org/)（Composition + Options 混合使用）
- **构建工具**: [Vite 5](https://vitejs.dev/)
- **状态管理**: [Pinia 2](https://pinia.vuejs.org/)，配合 [`pinia-plugin-persistedstate`](https://prazdevs.github.io/pinia-plugin-persistedstate/) 写入 `localStorage` 实现持久化
- **路由管理**: [Vue Router 4](https://router.vuejs.org/)
- **UI 组件库**: [Element Plus](https://element-plus.org/) + [@element-plus/icons-vue](https://element-plus.org/en-US/component/icon.html)
- **样式**: SCSS（`sass`，modern-compiler API）
- **工具库**:
  - [lz-string](https://github.com/pieroxy/lz-string/)：收藏夹导入导出压缩
  - [Axios](https://axios-http.com/)：HTTP 请求
  - [Fuse.js](https://www.fusejs.io/)：模糊搜索
  - [pdfmake](http://pdfmake.org/)：PDF 生成
  - [marked](https://marked.js.org/) + [highlight.js](https://highlightjs.org/)：Markdown / 代码高亮
  - [mermaid](https://mermaid.js.org/)：UML / 流程图渲染（NCRE3 模块用）

## 🚀 快速开始 (Getting Started)

### 环境要求
- Node.js（推荐 LTS，≥ 18）
- pnpm（推荐）或 npm

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/fgh23333/crawlerVisualization.git
   cd crawlerVisualization
   ```

2. **安装依赖**
   ```bash
   pnpm install
   # 或者
   npm install
   ```

3. **启动开发服务器**
   ```bash
   pnpm dev
   # 或者
   npm run dev
   ```
   默认运行在 `http://localhost:5173/`。可通过 `pnpm dev --port 8080` 自定义端口。

4. **构建生产版本**
   ```bash
   pnpm build
   ```
   产物输出到 `dist/`。可用 `pnpm preview` 在本地预览。

## 📂 项目结构 (Project Structure)

```
src/
├── assets/           # 静态资源（图片、SVG 图标）
├── components/       # 公共组件
│   ├── QuestionItem.vue  # 单题渲染组件（判断/填空/单选/多选）
│   ├── questionCard.vue  # 题目列表容器（筛选、搜索、快捷键）
│   ├── examCard.vue      # 考试试题卡片
│   ├── examRecord.vue    # 答题卡 / 做题记录
│   ├── modal.vue         # 弹窗组件
│   └── topBar.vue        # 顶部导航栏
├── router/           # 路由配置（/ / /newHome / /ncre3 / /computer-question）
├── stores/           # Pinia 状态管理
│   ├── question.js       # 思政题库状态（错题/收藏/标记/学习记录/导入导出）
│   ├── ncre3.js          # NCRE3 题库状态
│   ├── computerQuestion.js # 计算机组成原理题库状态
│   └── exam.js           # 考试相关状态
├── utils/            # 工具函数
│   ├── favoritesSync.js  # 收藏夹导入导出（编码/解码/压缩/合并）
│   ├── questionType.ts   # 题型判断 & 中文标签
│   ├── loadJson.js       # 运行时从 R2 拉取题库数据
│   ├── makePdf.js        # PDF 生成
│   └── ...               # Markdown 渲染等
├── views/            # 页面视图
│   ├── new/              # 主入口 UI（/newHome 路径下）
│   ├── ncre3/            # NCRE 三级题库 UI
│   ├── computerQuestion/ # 计算机组成原理题库 UI
│   └── ...               # 旧版表格化视图（/rightWrong、/multipleChoice 等）
├── App.vue           # 根组件
└── main.js           # 入口文件
```

## 💾 数据持久化

Pinia store 通过 `pinia-plugin-persistedstate` 将以下字段写入 `localStorage`：

- `wrongQuestions` — 错题本
- `likeList` — 收藏夹
- `markList` — 标记列表
- `userRecords` — 学习记录（每题做题次数 / 错题次数 / 最近错题日期）

此外，以下 UI 状态也持久化到 `localStorage`：

- `viewed_*` — 已查看答案的题目 ID 集合
- `viewed_*_showAll` — 答案全局开关状态
- `defaultShowAnswer` — 默认答案显示偏好

清除浏览器站点数据即可重置。

## 📄 许可证 (License)

本项目采用 [MIT License](LICENSE) 开源许可证。
