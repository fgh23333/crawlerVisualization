/**
 * 运行时 JSON 数据加载器
 * 从 Cloudflare R2 拉取题库数据，带 localStorage 缓存 + 版本检查
 *
 * 环境变量:
 *   VITE_DATA_URL - R2 数据源地址（如 https://data.example.com）
 *                   未配置时回退到本地 /src/assets/ 的静态导入
 */

const DATA_URL = import.meta.env.VITE_DATA_URL || ''
const CACHE_PREFIX = 'qb_'
const VERSION_KEY = 'qb_version'

// ======================== 版本检查 ========================

let versionChecked = false

async function checkVersion() {
  if (versionChecked || !DATA_URL) return
  versionChecked = true

  try {
    const res = await fetch(`${DATA_URL}/version.json`, { cache: 'no-cache' })
    if (!res.ok) return
    const { version } = await res.json()
    const old = localStorage.getItem(VERSION_KEY)
    if (version !== old) {
      // 数据版本变了，清掉旧缓存
      clearDataCache()
      localStorage.setItem(VERSION_KEY, version)
    }
  } catch {
    // 网络异常时静默跳过，继续用缓存
  }
}

function clearDataCache() {
  const keys = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k?.startsWith(CACHE_PREFIX)) keys.push(k)
  }
  keys.forEach(k => localStorage.removeItem(k))
}

// 启动时后台检查一次版本
checkVersion()

// ======================== 数据加载 ========================

async function fetchJson(path) {
  const url = DATA_URL ? `${DATA_URL}${path}` : path
  const cacheKey = CACHE_PREFIX + path.replace(/[^a-zA-Z0-9]/g, '_')

  // 1. 先尝试 localStorage 缓存
  const cached = localStorage.getItem(cacheKey)
  if (cached) {
    try { return JSON.parse(cached) } catch { /* 缓存损坏，继续拉取 */ }
  }

  // 2. 从 R2 / CDN 拉取
  const res = await fetch(url)
  if (!res.ok) throw new Error(`加载失败: ${path} (${res.status})`)
  const data = await res.json()

  // 3. 写入 localStorage 缓存（下次秒开）
  try {
    localStorage.setItem(cacheKey, JSON.stringify(data))
  } catch {
    // localStorage 满了，清旧数据重试
    clearDataCache()
    try { localStorage.setItem(cacheKey, JSON.stringify(data)) } catch { /* 放弃缓存 */ }
  }

  return data
}

// ======================== 导出（保持原有接口不变） ========================

/**
 * 加载题库数据
 * @param {string} lesson - 科目名（如 'Marx'）
 * @param {string} type   - 题型（singleChoice / multipleChoice / rightWrong / fillingBlank / subject）
 */
export async function loadQuestionBank(lesson, type) {
  return fetchJson(`/rewrite/${lesson}_${type}.json`)
}

/**
 * 加载考试卷数据
 * @param {string} lesson - 科目名
 * @param {string} id     - 试卷编号
 */
export async function loadExamPaper(lesson, id) {
  return fetchJson(`/cura/${lesson}_${id}.json`)
}
