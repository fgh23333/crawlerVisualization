/**
 * 匿名错题频率采集（客户端）—— 只上送题目 ID 级计数，无题目内容、无个人信息。
 *
 * 数据流：作答漏斗 noteAnswer 累计增量（localStorage wstats_pending，先落盘后发送）
 *   → flushWrongStats 按 batchId 批量 POST /api/wrongstats
 *   → 服务端 D1 按 batchId 主键去重后累加进全站聚合表 question_stats
 *
 * 键名一律 wstats_*：loadJson 的版本热更新只清 qb_* 前缀键，这些键不受影响。
 * 去重保证：seq/batchId 在发送前持久化，服务端按 batchId 幂等 —— 同一批次
 * 重放不会重复计数；beacon 场景读不到响应，直接清队列（只可能丢，不可能重）。
 * 全链路 try/catch 静默：采集永远不能影响答题主链路。可在「关于」页关闭。
 */

const PENDING_KEY = 'wstats_pending'
const UUID_KEY = 'wstats_uuid'
const SEQ_KEY = 'wstats_seq'
const ENABLED_KEY = 'wstats_enabled'
const ENDPOINT = '/api/wrongstats'
const MAX_PENDING = 200 // 与服务端单批上限一致，FIFO 截断
// 只采集思政九科（ncre3 / 计组题无 abbreviationSubject，天然被排除）
const SUBJECT_SET = new Set(['Marx', 'CMH', 'Political', 'MaoIntro', 'XiIntro', 'SDH', 'NCH', 'CCPH', 'ORH'])

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch { /* 配额满：丢一条增量不致命 */ }
}

/** 默认开启，仅显式 'false' 视为关闭（容错：损坏值也按开处理） */
export function isStatsEnabled() {
  try {
    return localStorage.getItem(ENABLED_KEY) !== 'false'
  } catch {
    return true
  }
}

/** 关闭共享：丢弃未上送的增量，之后 noteAnswer 变 no-op */
export function setStatsEnabled(v) {
  try {
    localStorage.setItem(ENABLED_KEY, v ? 'true' : 'false')
    if (!v) localStorage.removeItem(PENDING_KEY)
  } catch { /* 静默 */ }
}

/** 匿名客户端标识：首次生成后稳定（crypto.randomUUID 优先，带降级） */
export function getClientUuid() {
  let uuid = null
  try { uuid = localStorage.getItem(UUID_KEY) } catch { /* 静默 */ }
  if (!uuid) {
    uuid = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : 'c-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)
    try { localStorage.setItem(UUID_KEY, uuid) } catch { /* 静默 */ }
  }
  return uuid
}

/**
 * 作答漏斗钩子（stores/question.js updateUserRecord 调用）：
 * 累计每题 {s, a, e} 增量，同题合并累加、同步落盘（先落盘后发送，崩溃不丢），
 * 条目数超 MAX_PENDING 时按插入序丢最旧（Object 键序 = 插入序）。
 */
export function noteAnswer(questionId, subject, isCorrect) {
  try {
    if (!isStatsEnabled()) return
    const id = String(questionId ?? '')
    if (!id || !SUBJECT_SET.has(subject)) return
    const pending = readJson(PENDING_KEY, {})
    const item = pending[id] || { s: subject, a: 0, e: 0 }
    item.s = subject
    item.a += 1
    if (!isCorrect) item.e += 1
    pending[id] = item
    const keys = Object.keys(pending)
    if (keys.length > MAX_PENDING) {
      for (const k of keys.slice(0, keys.length - MAX_PENDING)) delete pending[k]
    }
    writeJson(PENDING_KEY, pending)
  } catch { /* 静默 */ }
}

function clearPendingKeys(keys) {
  try {
    const pending = readJson(PENDING_KEY, {})
    for (const k of keys) delete pending[k]
    writeJson(PENDING_KEY, pending)
  } catch { /* 静默 */ }
}

/** 取一批待上送增量（快照 + 递增 batchId；seq 先持久化再发送） */
function takeBatch() {
  const pending = readJson(PENDING_KEY, {})
  const keys = Object.keys(pending)
  if (keys.length === 0) return null
  let seq = 0
  try { seq = Number(localStorage.getItem(SEQ_KEY)) || 0 } catch { /* 静默 */ }
  seq += 1
  try { localStorage.setItem(SEQ_KEY, String(seq)) } catch { /* 静默 */ }
  const batchId = getClientUuid() + '-' + String(seq).padStart(4, '0')
  const items = keys.map(k => ({ qid: k, s: pending[k].s, a: pending[k].a, e: pending[k].e }))
  return { batchId, items, keys }
}

/**
 * 冲刷一批增量。
 * beacon=true（页面隐藏/pagehide）：navigator.sendBeacon 发送后直接清队列 ——
 * beacon 读不到响应，靠服务端 batchId 幂等兜底，丢批可接受、重放不可能重计。
 * 默认 fetch：仅 HTTP 200 且 {ok:true} 才清队列；429/5xx/网络失败留存重试。
 */
export async function flushWrongStats({ beacon = false } = {}) {
  try {
    if (!isStatsEnabled()) return
    const batch = takeBatch()
    if (!batch) return
    const payload = JSON.stringify({
      v: 1,
      batchId: batch.batchId,
      uuid: getClientUuid(),
      items: batch.items
    })
    if (beacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([payload], { type: 'application/json' }))
      clearPendingKeys(batch.keys)
      return
    }
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload
    })
    if (res.ok) {
      const data = await res.json().catch(() => null)
      if (data && data.ok === true) clearPendingKeys(batch.keys)
    }
  } catch { /* 静默：失败留存，下个冲刷周期重试 */ }
}

let initialized = false

/** 挂载采集触发器（main.js mount 后调用一次）：启动冲刷 + 定时 + 页面隐藏 beacon */
export function initWrongStats() {
  if (initialized) return
  initialized = true
  try {
    setTimeout(() => { flushWrongStats() }, 5000)
    setInterval(() => { flushWrongStats() }, 5 * 60 * 1000)
    const onHidden = () => {
      if (document.visibilityState === 'hidden') flushWrongStats({ beacon: true })
    }
    document.addEventListener('visibilitychange', onHidden)
    window.addEventListener('pagehide', () => flushWrongStats({ beacon: true }))
  } catch { /* 静默 */ }
}

// 开发联调：控制台手动触发冲刷（配合 wrangler pages dev 本地验证）
if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.__flushWrongStats = flushWrongStats
}
