/**
 * 本地个性化引擎（方案 A）—— 纯函数，零依赖，node / vitest 可直接测试。
 *
 * 三个职责：
 * 1. 掌握度 mastery（0..1）：EWMA 指数衰减更新，吸收「对错 + 耗时快慢」信号
 * 2. 复习调度 FSRS-lite：间隔阶梯 [10min, 1d, 3d, 7d, 16d, 35d]，答错归零重爬
 * 3. 抽题权重乘子：掌握度低 → 更容易被抽中（1 + κ·(0.5 - mastery)）
 *
 * 所有引擎字段（mastery / lastAttemptAt / reviewStage / dueAt）懒初始化：
 * 旧持久化记录（只有 questionId / attempted / errorCount / lastErrorDate）无需
 * 迁移脚本，读路径自动回填引导值，写路径在下一次作答时长出新字段。
 */

// —— 可调常量（具名导出，便于测试与调参）——
export const MASTERY_ALPHA = 0.35        // EWMA 平滑系数：mastery = α·outcome + (1-α)·mastery
export const DEFAULT_MASTERY = 0.5       // 未见过题目的初始掌握度（也是抽题权重中性点）
export const LEGACY_MASTERY_MIN = 0.1    // 旧记录回填掌握度下限
export const LEGACY_MASTERY_MAX = 0.9    // 旧记录回填掌握度上限
export const MASTERY_KAPPA = 1.2         // 抽题权重敏感度：mastery 0→×1.6、1→×0.4、0.5→×1.0

// outcome 分档（对错 × 快慢四象限 + 无计时兜底）
export const OUTCOME_FAST_CORRECT = 1.0
export const OUTCOME_SLOW_CORRECT = 0.7  // 超时答对：会但不够熟
export const OUTCOME_FAST_WRONG = 0.2    // 快错 ≈ 粗心/蒙题，信号弱于慢错
export const OUTCOME_SLOW_WRONG = 0.0    // 慢错 = 真不会
export const OUTCOME_NO_TIME_CORRECT = 0.85  // 无计时数据时答对的兜底档
export const OUTCOME_NO_TIME_WRONG = 0.0     // 未作答即提交，与慢错同级

// 分题型快/慢分界基线（经验值；耗时超过基线 SLOW_FACTOR 倍记为「慢」）
export const TIME_BASELINE_MS = {
  singleChoice: 30000, multipleChoice: 45000, rightWrong: 20000, fillingBlank: 30000,
  单选: 30000, 多选: 45000, 判断: 20000, 填空: 30000,
  default: 30000,
}
export const SLOW_FACTOR = 2
export const TIME_MIN_MS = 2000            // 计时下限：防连点/脚本造成的 0ms 脏数据
export const EXAM_TIME_MAX_MS = 300000     // 考试模式计时上限（首末触碰跨度，封顶穿插空闲）
export const PRACTICE_TIME_MAX_MS = 180000 // 练习模式相邻提交间隔上限

// FSRS-lite 复习间隔阶梯：答错 stage=0 重爬；答对 stage+1，封顶末档
export const REVIEW_LADDER_MS = [
  10 * 60_000,     // 10 分钟：考完当场就能在错题本看到「待复习」
  1 * 86400_000,   // 1 天
  3 * 86400_000,   // 3 天
  7 * 86400_000,   // 7 天
  16 * 86400_000,  // 16 天
  35 * 86400_000,  // 35 天
]

export function baselineFor(questionType) {
  return TIME_BASELINE_MS[questionType] ?? TIME_BASELINE_MS.default
}

/**
 * 计时夹取：null/undefined 原样返回 null（表示「无计时数据」），
 * 否则四舍五入后夹到 [TIME_MIN_MS, maxMs]
 */
export function clampTimeMs(ms, maxMs = EXAM_TIME_MAX_MS) {
  if (ms === null || ms === undefined) return null
  const v = Number(ms)
  if (!Number.isFinite(v)) return null
  return Math.min(Math.max(Math.round(v), TIME_MIN_MS), maxMs)
}

/**
 * 单次作答的 outcome 值（0..1）：对错是主信号，耗时只做快慢塑形。
 * timeSpentMs 为 null 时走无计时兜底档。
 */
export function computeOutcome(isCorrect, timeSpentMs, questionType) {
  if (timeSpentMs === null || timeSpentMs === undefined) {
    return isCorrect ? OUTCOME_NO_TIME_CORRECT : OUTCOME_NO_TIME_WRONG
  }
  const isSlow = timeSpentMs > baselineFor(questionType) * SLOW_FACTOR
  if (isCorrect) return isSlow ? OUTCOME_SLOW_CORRECT : OUTCOME_FAST_CORRECT
  return isSlow ? OUTCOME_SLOW_WRONG : OUTCOME_FAST_WRONG
}

/**
 * 读取掌握度：
 * - 无记录 → DEFAULT_MASTERY（未见题的抽题权重不偏移）
 * - 已有 mastery → 原样返回
 * - 旧记录（有 attempted 无 mastery）→ 1 - errorCount/attempted 回填，clamp [0.1, 0.9]
 */
export function masteryOf(record) {
  if (!record) return DEFAULT_MASTERY
  if (typeof record.mastery === 'number' && Number.isFinite(record.mastery)) return record.mastery
  if (record.attempted > 0) {
    const guided = 1 - (record.errorCount || 0) / record.attempted
    return Math.min(Math.max(guided, LEGACY_MASTERY_MIN), LEGACY_MASTERY_MAX)
  }
  return DEFAULT_MASTERY
}

/** EWMA 更新：新掌握度 = α·outcome + (1-α)·旧掌握度 */
export function nextMastery(record, outcome) {
  return MASTERY_ALPHA * outcome + (1 - MASTERY_ALPHA) * masteryOf(record)
}

/**
 * 复习调度推进（FSRS-lite）：
 * - 答错 → stage=0，10 分钟后到期（当个会话内错题本就出现「待复习」）
 * - 答对且已在复习周期（有 reviewStage）→ stage+1 封顶，按新档间隔到期
 * - 答对且从未错过 → 不进入复习周期（dueAt / reviewStage 均为 null）
 */
export function nextReview(record, isCorrect, now = Date.now()) {
  if (!isCorrect) {
    return { reviewStage: 0, dueAt: now + REVIEW_LADDER_MS[0] }
  }
  if (record && record.reviewStage !== null && record.reviewStage !== undefined) {
    const stage = Math.min(record.reviewStage + 1, REVIEW_LADDER_MS.length - 1)
    return { reviewStage: stage, dueAt: now + REVIEW_LADDER_MS[stage] }
  }
  return { reviewStage: null, dueAt: null }
}

/**
 * 是否到期该复习（错题本语境）：没有未来到期时间 = 需要复习 → true
 * （旧记录 / 从未调度的错题 / 迁移产生的 {id} 桩都视为到期）
 */
export function isDue(record, now = Date.now()) {
  if (!record || record.dueAt === null || record.dueAt === undefined) return true
  return record.dueAt <= now
}

/** 抽题权重乘子：掌握度低于 0.5 加权、高于 0.5 降权，0.5 处恰为 1（无记录用户行为不变） */
export function masteryWeightMultiplier(mastery, kappa = MASTERY_KAPPA) {
  return 1 + kappa * (0.5 - mastery)
}

/**
 * 错题列表稳定排序：到期在前、未到期在后，两组内部保持插入序。
 * 注意：只应在「切入错题 tab」时调用一次做快照——若做成响应式实时排序，
 * 练习中 dueAt 变化会重排列表，使 questionCard 按下标键控的练习会话状态错位。
 */
export function sortWrongByDue(wrongList, userRecords, now = Date.now()) {
  const records = userRecords || {}
  const due = wrongList.filter(q => isDue(records[q.id], now))
  const notDue = wrongList.filter(q => !isDue(records[q.id], now))
  return [...due, ...notDue]
}

/** 统计到期待复习数量（提示数字用活数据 + 活时钟，与排序快照解耦） */
export function countDue(wrongList, userRecords, now = Date.now()) {
  const records = userRecords || {}
  return wrongList.reduce((n, q) => n + (isDue(records[q.id], now) ? 1 : 0), 0)
}
