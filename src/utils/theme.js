/**
 * 夜间模式（暗色主题）：html.dark 类驱动，选择持久化在 localStorage `qb_theme`。
 * - 未显式选择过时跟随系统 prefers-color-scheme；
 * - index.html 里有同口径的内联引导脚本（渲染前先挂类，防首屏闪白）；
 * - 样式分两层：Element Plus 走官方 dark css-vars，自定义 SCSS 走 src/styles/dark.scss。
 */

const THEME_KEY = 'qb_theme'

export function isDark() {
  return typeof document !== 'undefined'
    && document.documentElement.classList.contains('dark')
}

/** 读取用户显式选择；未选择过返回 null（表示跟随系统） */
export function getStoredTheme() {
  try {
    const v = localStorage.getItem(THEME_KEY)
    if (v === 'light' || v === 'dark') return v
  } catch { /* 隐私模式等存储不可用时静默降级为跟随系统 */ }
  return null
}

/** 实际生效主题：显式选择优先，否则跟随系统 */
export function resolveTheme() {
  const stored = getStoredTheme()
  if (stored) return stored
  try {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
  } catch { /* matchMedia 不可用按浅色处理 */ }
  return 'light'
}

export function applyTheme(theme) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', theme === 'dark')
  // color-scheme 属性让原生滚动条/表单控件同步变暗（dark.scss 里也有兜底声明）
}

/** 应用启动时调用：对齐 html.dark 类，并监听系统主题变化（仅未显式选择时生效） */
export function initTheme() {
  applyTheme(resolveTheme())
  try {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e) => {
      if (!getStoredTheme()) applyTheme(e.matches ? 'dark' : 'light')
    }
    if (mq.addEventListener) mq.addEventListener('change', onChange)
    else if (mq.addListener) mq.addListener(onChange) // 旧 Safari
  } catch { /* 无监听能力则只在刷新时重新解析 */ }
}

/** 切换并持久化；返回切换后的主题 */
export function toggleTheme() {
  const next = isDark() ? 'light' : 'dark'
  try { localStorage.setItem(THEME_KEY, next) } catch { /* 存不进就当会话内切换 */ }
  applyTheme(next)
  return next
}
