/**
 * 学习统计聚合器 —— 纯函数、零 Vue 依赖（node / vitest 可直接测试），风格对齐 mastery.js。
 *
 * 数据源（均为 question store 已持久化的本地数据）：
 * 1. userRecords：每题计数（attempted / errorCount / 可选 subject 冗余）
 * 2. 错题 / 收藏 / 标记三张列表：完整题对象，可零网络恢复题干与科目
 * 3. localStorage 的 qb__rewrite_* 题库缓存：历史加载过的科目题库，补全元数据
 *
 * 约定：
 * - 思政 9 科口径：record.subject 或元数据命中九科编码才计入聚合，
 *   其余（如 ncre3 题无科目）计入 uncovered，不进科目/题型/榜单
 * - 所有聚合只做一次性快照计算，调用方绝不能把结果做成响应式联动
 */
import { isDue, countDue } from './mastery'

// —— 九科编码与短名（与 examView.abbreviationSubjectList 同源）——
export const SUBJECT_CODES = ['Marx', 'CMH', 'Political', 'MaoIntro', 'XiIntro', 'SDH', 'NCH', 'CCPH', 'ORH']
export const SUBJECT_LABELS = {
  Marx: '马原',
  CMH: '近代史',
  Political: '思政',
  MaoIntro: '毛概',
  XiIntro: '习概',
  SDH: '社主史',
  NCH: '新中国史',
  CCPH: '党史',
  ORH: '改开史'
}
const SUBJECT_SET = new Set(SUBJECT_CODES)

export const TYPE_ORDER = ['判断', '单选', '多选', '填空']

/**
 * 题型推断：与 stores/question.js 的 getType 同口径
 * （填空 = 无选项；判断 = 两选项；多选 = 答案长度 > 1；其余单选）
 */
export function typeOfQuestion(q) {
  if (!q) return null
  if (!q.option || q.option.length === 0) return '填空'
  if (q.option.length === 2) return '判断'
  if (typeof q.answer === 'string' && q.answer.length > 1) return '多选'
  return '单选'
}

/**
 * 固定 UTC+8（Asia/Shanghai）时区的时间格式化——全站时间记录统一上海时区
 * @returns 'YYYY-MM-DD HH:mm'（withSeconds 时带秒）
 */
export function formatShanghaiTime(ts, withSeconds = false) {
  if (!Number.isFinite(ts)) return ''
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    ...(withSeconds ? { second: '2-digit' } : {})
  }).formatToParts(new Date(ts))
  const get = (t) => parts.find(p => p.type === t)?.value || '00'
  const base = `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}`
  return withSeconds ? `${base}:${get('second')}` : base
}

// —— 元数据索引 ─────────────────────────────────────────

/**
 * 从错题/收藏/标记列表构建 id → {stem, subject, type} 索引（同步、零网络）。
 * 首个命中者胜（三张列表同题内容一致），科目只认九科编码。
 */
export function buildListIndex(lists = []) {
  const index = new Map()
  for (const list of (lists || [])) {
    if (!Array.isArray(list)) continue
    for (const q of list) {
      if (!q || q.id === undefined || q.id === null) continue
      const id = String(q.id)
      if (index.has(id)) continue
      index.set(id, {
        stem: q.questionStem || '',
        subject: SUBJECT_SET.has(q.abbreviationSubject) ? q.abbreviationSubject : null,
        type: typeOfQuestion(q)
      })
    }
  }
  return index
}

const BANK_KEY_PREFIX = 'qb__rewrite_'
const BANK_KEY_SUFFIX = '_json'

/** 列出 localStorage 里所有题库缓存键（qb__rewrite_<lesson>_<type>_json） */
export function listBankCacheKeys() {
  const keys = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith(BANK_KEY_PREFIX) && k.endsWith(BANK_KEY_SUFFIX)) keys.push(k)
  }
  return keys
}

/** 解析缓存键 → {lesson, type}；lesson 不在九科内（如未知前缀）返回 null */
export function parseBankCacheKey(key) {
  if (!key.startsWith(BANK_KEY_PREFIX) || !key.endsWith(BANK_KEY_SUFFIX)) return null
  const mid = key.slice(BANK_KEY_PREFIX.length, key.length - BANK_KEY_SUFFIX.length)
  const idx = mid.lastIndexOf('_')
  if (idx <= 0) return null
  const lesson = mid.slice(0, idx)
  const type = mid.slice(idx + 1)
  if (!SUBJECT_SET.has(lesson)) return null
  return { lesson, type }
}

/**
 * 扫描本地题库缓存，把历史加载过的题目元数据并入索引（零网络）。
 * 文件之间让出主线程（setTimeout 0），避免多文件解析卡 UI；
 * 损坏的缓存条目跳过不致命。onProgress(done, total) 可选进度回调。
 * @returns {Promise<{index: Map, files: number}>}
 */
export async function buildBankIndexFromCache(onProgress) {
  const index = new Map()
  const keys = listBankCacheKeys()
  let done = 0
  for (const key of keys) {
    const meta = parseBankCacheKey(key)
    if (meta) {
      try {
        const data = JSON.parse(localStorage.getItem(key))
        if (Array.isArray(data)) {
          for (const q of data) {
            if (!q || q.id === undefined || q.id === null) continue
            const id = String(q.id)
            if (index.has(id)) continue
            index.set(id, {
              stem: q.questionStem || '',
              subject: meta.lesson,
              type: typeOfQuestion(q)
            })
          }
        }
      } catch { /* 缓存损坏，跳过该文件 */ }
    }
    done++
    if (onProgress) onProgress(done, keys.length)
    await new Promise(r => setTimeout(r, 0))
  }
  return { index, files: keys.length }
}

// —— 聚合计算 ───────────────────────────────────────────

/** 解析一条记录的科目：record.subject 优先，元数据兜底，九科之外视为未知 */
function subjectOfRecord(rec, metaOf, qid) {
  if (SUBJECT_SET.has(rec?.subject)) return rec.subject
  const meta = metaOf ? metaOf(qid) : null
  if (meta && SUBJECT_SET.has(meta.subject)) return meta.subject
  return null
}

function accuracy(errors, attempted) {
  return attempted > 0 ? 1 - errors / attempted : null
}

/**
 * 按科目聚合：{rows: [{subject, label, attempted, errors, accuracy}], uncovered}
 * rows 按作答次数降序；uncovered = 无法归入九科的记录条数（如 ncre3 题）
 */
export function subjectAggregates(userRecords, metaOf) {
  const acc = new Map()
  let uncovered = 0
  for (const [qid, rec] of Object.entries(userRecords || {})) {
    const attempted = rec?.attempted || 0
    if (attempted <= 0) continue
    const subject = subjectOfRecord(rec, metaOf, qid)
    if (!subject) { uncovered++; continue }
    if (!acc.has(subject)) acc.set(subject, { subject, attempted: 0, errors: 0 })
    const row = acc.get(subject)
    row.attempted += attempted
    row.errors += rec.errorCount || 0
  }
  const rows = [...acc.values()]
    .map(r => ({ ...r, label: SUBJECT_LABELS[r.subject] || r.subject, accuracy: accuracy(r.errors, r.attempted) }))
    .sort((a, b) => b.attempted - a.attempted)
  return { rows, uncovered }
}

/**
 * 按题型聚合：题型只能来自元数据（题面形状推断），无元数据的记录计入 uncovered
 */
export function typeAggregates(userRecords, metaOf) {
  const acc = new Map(TYPE_ORDER.map(t => [t, { type: t, attempted: 0, errors: 0 }]))
  let uncovered = 0
  for (const [qid, rec] of Object.entries(userRecords || {})) {
    const attempted = rec?.attempted || 0
    if (attempted <= 0) continue
    // 题型聚合同时要求科目口径一致（思政 9 科），ncre3 题不进榜单
    if (!subjectOfRecord(rec, metaOf, qid)) { uncovered++; continue }
    const meta = metaOf ? metaOf(qid) : null
    const type = meta?.type
    if (!TYPE_ORDER.includes(type)) { uncovered++; continue }
    const row = acc.get(type)
    row.attempted += attempted
    row.errors += rec.errorCount || 0
  }
  const rows = TYPE_ORDER
    .map(t => {
      const r = acc.get(t)
      return { ...r, attempted: r.attempted, accuracy: accuracy(r.errors, r.attempted) }
    })
    .filter(r => r.attempted > 0)
  return { rows, uncovered }
}

/**
 * 题目正确率榜单（worst = 最低在前 / best = 最高在前）
 * 只收九科口径的题；attempted < minAttempts 不入榜（1 次答对不代表掌握）。
 * @returns [{id, stem, subject, label, type, attempted, errorCount, accuracy, due}]
 */
export function rankQuestions(userRecords, metaOf, { minAttempts = 3, limit = 10, order = 'worst' } = {}) {
  const rows = []
  for (const [qid, rec] of Object.entries(userRecords || {})) {
    const attempted = rec?.attempted || 0
    if (attempted < minAttempts) continue
    const subject = subjectOfRecord(rec, metaOf, qid)
    if (!subject) continue
    const meta = metaOf ? metaOf(qid) : null
    rows.push({
      id: qid,
      stem: meta?.stem || '',
      subject,
      label: SUBJECT_LABELS[subject] || subject,
      type: meta?.type || null,
      attempted,
      errorCount: rec.errorCount || 0,
      accuracy: accuracy(rec.errorCount || 0, attempted),
      due: isDue(rec)
    })
  }
  rows.sort((a, b) =>
    (order === 'best' ? b.accuracy - a.accuracy : a.accuracy - b.accuracy) ||
    b.attempted - a.attempted
  )
  return rows.slice(0, limit)
}

/**
 * 考试成绩趋势（仅思政卷）：时间升序点列 + 汇总
 * @returns {points: [{ts, date, lesson, label, paperId, score, total, rate}], summary: {count, avgRate}}
 */
export function examTrend(examHistory, { lesson } = {}) {
  const list = (examHistory || []).filter(h =>
    h && h.kind === 'sizheng' &&
    Number.isFinite(h.score) && h.total > 0 &&
    (!lesson || h.lesson === lesson)
  )
  list.sort((a, b) => a.ts - b.ts)
  const points = list.map(h => ({
    ts: h.ts,
    date: h.date || formatShanghaiTime(h.ts),
    lesson: h.lesson,
    label: SUBJECT_LABELS[h.lesson] || h.lesson,
    paperId: h.paperId,
    score: h.score,
    total: h.total,
    rate: Math.round((h.score / h.total) * 1000) / 10
  }))
  const avgRate = points.length
    ? Math.round(points.reduce((s, p) => s + p.rate, 0) / points.length * 10) / 10
    : null
  return { points, summary: { count: points.length, avgRate } }
}

/**
 * 顶部 KPI：累计作答 / 总体正确率 / 待复习数 / 思政考试场次
 */
export function overallKpis(userRecords, wrongQuestions = [], examHistory = []) {
  let totalAttempts = 0
  let totalErrors = 0
  for (const rec of Object.values(userRecords || {})) {
    totalAttempts += rec?.attempted || 0
    totalErrors += rec?.errorCount || 0
  }
  const examCount = (examHistory || []).filter(h => h?.kind === 'sizheng').length
  return {
    totalAttempts,
    totalErrors,
    accuracy: accuracy(totalErrors, totalAttempts),
    dueCount: countDue(wrongQuestions, userRecords),
    examCount
  }
}
