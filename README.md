# Political Exam Practice System

一个基于 Vue.js 2 的政治理论课刷题与模拟考试系统。旨在帮助学生高效复习各类政治理论课程，支持多种题型练习、模拟考试、错题回顾以及 AI 辅助学习。

## ✨ 主要功能 (Features)

- **多科目支持**：涵盖马原、毛概、思修、史纲、形势与政策等多个政治理论科目。
- **全题型覆盖**：
  - 单选题 (Single Choice)
  - 多选题 (Multiple Choice)
  - 判断题 (True/False)
  - 填空题 (Fill in the Blank)
- **模拟考试 (Mock Exam)**：
  - 随机组卷或指定章节练习
  - 自动评分与答题解析
- **个性化学习**：
  - **错题本 (Wrong Questions)**：自动记录做错的题目，方便查漏补缺。
  - **收藏夹 (Favorites)**：重点题目一键收藏。
  - **学习记录 (User Records)**：统计做题情况和正确率。
- **实用工具**：
  - **PDF 导出**：支持将试题导出为 PDF 文件，方便打印复习。
  - **AI 助手**：内置 Gemma AI 对话功能，辅助解答疑惑。
- **现代化界面**：提供全新的移动端友好界面 (`/newHome`)，交互流畅。

## 🛠 技术栈 (Tech Stack)

- **核心框架**: [Vue.js 2.x](https://v2.vuejs.org/)
- **状态管理**: [Vuex](https://vuex.vuejs.org/) (配合 `vuex-persistedstate` 实现数据持久化)
- **路由管理**: [Vue Router](https://router.vuejs.org/)
- **UI 组件库**:
  - [Vant UI](https://vant-ui.github.io/vant/v2/) (移动端/新版界面)
  - [Element UI](https://element.eleme.io/) (桌面端/通用组件)
- **工具库**:
  - [Axios](https://axios-http.com/): HTTP 请求
  - [Fuse.js](https://www.fusejs.io/): 模糊搜索支持
  - [pdfmake](http://pdfmake.org/): PDF 生成
  - [Less](http://lesscss.org/): CSS 预处理器

## 🚀 快速开始 (Getting Started)

### 环境要求
- Node.js (推荐 LTS 版本)
- npm 或 pnpm

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/fgh23333/crawlerVisualization.git
   cd crawlerVisualization
   ```

2. **安装依赖**
   ```bash
   npm install
   # 或者
   pnpm install
   ```

3. **运行开发服务器**
   ```bash
   npm run serve
   ```
   启动后访问 `http://localhost:8080` (端口可能根据占用情况变化)。

4. **构建生产版本**
   ```bash
   npm run build
   ```

## 📂 项目结构 (Project Structure)

```
src/
├── assets/          # 静态资源（题目JSON数据、图片、图标）
├── components/      # 公共组件 (ExamCard, QuestionCard, Gemma等)
├── router/          # 路由配置
├── store/           # Vuex 状态管理 (题库、错题、收藏、成绩)
├── utils/           # 工具函数 (PDF生成, 试卷生成器等)
├── views/           # 页面视图
│   ├── new/         # 新版UI页面 (Home, Exam, Chat, etc.)
│   └── ...          # 旧版/通用视图
├── App.vue          # 根组件
└── main.js          # 入口文件
```

## 📄 许可证 (License)

本项目采用 [MIT License](LICENSE) 开源许可证。
