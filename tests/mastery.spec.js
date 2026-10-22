import { describe, it, expect } from 'vitest'
import {
  DEFAULT_MASTERY,
  REVIEW_LADDER_MS,
  OUTCOME_FAST_CORRECT,
  OUTCOME_SLOW_CORRECT,
  OUTCOME_FAST_WRONG,
  OUTCOME_SLOW_WRONG,
  OUTCOME_NO_TIME_CORRECT,
  OUTCOME_NO_TIME_WRONG,
  baselineFor,
  clampTimeMs,
  computeOutcome,
  masteryOf,
  nextMastery,
  nextReview,
  isDue,
  masteryWeightMultiplier,
  sortWrongByDue,
  countDue,
} from '../src/utils/mastery'

// 掌握度引擎是方案 A（本地个性化）的核心：EWMA + FSRS-lite 全部在此验证
describe('baselineFor 分题型基线', () => {
  it('中文标签 / 英文键 / 未知题型', () => {
    expect(baselineFor('单选')).toBe(30000)
    expect(baselineFor('多选')).toBe(45000)
    expect(baselineFor('判断')).toBe(20000)
    expect(baselineFor('singleChoice')).toBe(30000)
    expect(baselineFor('whatever')).toBe(30000)
  })
})

describe('clampTimeMs 计时夹取', () => {
  it('null/undefined 原样返回 null（表示无计时数据）', () => {
    expect(clampTimeMs(null)).toBeNull()
    expect(clampTimeMs(undefined)).toBeNull()
    expect(clampTimeMs('abc')).toBeNull()
  })
  it('低于下限抬到 2s，高于上限封顶，支持自定义上限', () => {
    expect(clampTimeMs(100)).toBe(2000)
    expect(clampTimeMs(99999999)).toBe(300000)
    expect(clampTimeMs(250000, 180000)).toBe(180000)
    expect(clampTimeMs(12345.6)).toBe(12346)
  })
})

describe('computeOutcome 对错 × 快慢四象限', () => {
  // 单选基线 30s，2 倍 = 60s 为快/慢分界
  it('快答对=1.0 / 慢答对=0.7 / 快答错=0.2 / 慢答错=0', () => {
    expect(computeOutcome(true, 20000, '单选')).toBe(OUTCOME_FAST_CORRECT)
    expect(computeOutcome(true, 70000, '单选')).toBe(OUTCOME_SLOW_CORRECT)
    expect(computeOutcome(false, 10000, '单选')).toBe(OUTCOME_FAST_WRONG)
    expect(computeOutcome(false, 80000, '单选')).toBe(OUTCOME_SLOW_WRONG)
  })
  it('四档严格递减：快对 > 慢对 > 快错 > 慢错', () => {
    expect(OUTCOME_FAST_CORRECT).toBeGreaterThan(OUTCOME_SLOW_CORRECT)
    expect(OUTCOME_SLOW_CORRECT).toBeGreaterThan(OUTCOME_FAST_WRONG)
    expect(OUTCOME_FAST_WRONG).toBeGreaterThan(OUTCOME_SLOW_WRONG)
  })
  it('无计时数据走兜底档', () => {
    expect(computeOutcome(true, null, '单选')).toBe(OUTCOME_NO_TIME_CORRECT)
    expect(computeOutcome(false, null, '单选')).toBe(OUTCOME_NO_TIME_WRONG)
  })
  it('分界点恰为基线 2 倍：60s 仍算快，60s+1ms 算慢', () => {
    expect(computeOutcome(true, 60000, '单选')).toBe(OUTCOME_FAST_CORRECT)
    expect(computeOutcome(true, 60001, '单选')).toBe(OUTCOME_SLOW_CORRECT)
  })
})

describe('masteryOf 读取与旧记录回填', () => {
  it('无记录 → 0.5 中性', () => {
    expect(masteryOf(null)).toBe(DEFAULT_MASTERY)
    expect(masteryOf(undefined)).toBe(0.5)
  })
  it('已有 mastery 原样返回', () => {
    expect(masteryOf({ mastery: 0.73 })).toBe(0.73)
  })
  it('旧记录（只有 4 个计数字段）按正确率回填并 clamp', () => {
    expect(masteryOf({ attempted: 4, errorCount: 1 })).toBeCloseTo(0.75)
    expect(masteryOf({ attempted: 10, errorCount: 10 })).toBe(0.1) // 下限
    expect(masteryOf({ attempted: 10, errorCount: 0 })).toBe(0.9)  // 上限
  })
  it('attempted 缺失（迁移桩 {id}）→ 0.5', () => {
    expect(masteryOf({})).toBe(0.5)
  })
})

describe('nextMastery EWMA 更新', () => {
  it('未见题首答：对 → 0.675、错 → 0.325', () => {
    expect(nextMastery(null, 1.0)).toBeCloseTo(0.675)
    expect(nextMastery(null, 0.0)).toBeCloseTo(0.325)
  })
  it('连对单调升、连错单调降', () => {
    let record = null
    let prev = -Infinity
    for (let i = 0; i < 3; i++) {
      record = { mastery: nextMastery(record, OUTCOME_FAST_CORRECT) }
      expect(record.mastery).toBeGreaterThan(prev)
      prev = record.mastery
    }
    prev = Infinity
    for (let i = 0; i < 2; i++) {
      record = { mastery: nextMastery(record, OUTCOME_SLOW_WRONG) }
      expect(record.mastery).toBeLessThan(prev)
      prev = record.mastery
    }
  })
  it('快答对收益 > 慢答对收益（耗时塑形生效）', () => {
    expect(nextMastery(null, OUTCOME_FAST_CORRECT))
      .toBeGreaterThan(nextMastery(null, OUTCOME_SLOW_CORRECT))
  })
})

describe('nextReview FSRS-lite 复习阶梯', () => {
  const NOW = 1_000_000
  it('答错：stage=0，10 分钟后到期', () => {
    expect(nextReview(null, false, NOW)).toEqual({ reviewStage: 0, dueAt: NOW + REVIEW_LADDER_MS[0] })
    expect(REVIEW_LADDER_MS[0]).toBe(10 * 60 * 1000)
  })
  it('从未错过而答对：不进入复习周期', () => {
    expect(nextReview(null, true, NOW)).toEqual({ reviewStage: null, dueAt: null })
    expect(nextReview({ attempted: 3 }, true, NOW)).toEqual({ reviewStage: null, dueAt: null })
  })
  it('答对且已在复习周期：stage 沿阶梯推进', () => {
    expect(nextReview({ reviewStage: 0 }, true, NOW))
      .toEqual({ reviewStage: 1, dueAt: NOW + REVIEW_LADDER_MS[1] })
    expect(nextReview({ reviewStage: 3 }, true, NOW))
      .toEqual({ reviewStage: 4, dueAt: NOW + REVIEW_LADDER_MS[4] })
  })
  it('阶梯封顶：满级后继续答对保持末档 35 天', () => {
    expect(nextReview({ reviewStage: 5 }, true, NOW))
      .toEqual({ reviewStage: 5, dueAt: NOW + REVIEW_LADDER_MS[5] })
    expect(REVIEW_LADDER_MS[5]).toBe(35 * 86400 * 1000)
  })
  it('再答错归零重爬', () => {
    expect(nextReview({ reviewStage: 4 }, false, NOW))
      .toEqual({ reviewStage: 0, dueAt: NOW + REVIEW_LADDER_MS[0] })
  })
})

describe('isDue 到期判定', () => {
  it('无记录 / dueAt 为空 / 已过期 → 到期；未来 → 未到期', () => {
    expect(isDue(null)).toBe(true)
    expect(isDue({ dueAt: null })).toBe(true)
    expect(isDue({ dueAt: 500 })).toBe(true)
    expect(isDue({ dueAt: Date.now() + 60_000 })).toBe(false)
  })
})

describe('masteryWeightMultiplier 抽题权重乘子', () => {
  it('0.5 处恒等 1（无记录用户行为不变）；两端 1.6 / 0.4', () => {
    expect(masteryWeightMultiplier(0.5)).toBe(1)
    expect(masteryWeightMultiplier(0)).toBeCloseTo(1.6)
    expect(masteryWeightMultiplier(1)).toBeCloseTo(0.4)
  })
})

describe('sortWrongByDue / countDue 错题排序与统计', () => {
  const w = (id) => ({ id, questionStem: id })
  const records = {
    b: { dueAt: Date.now() + 86400_000 }, // b 未到期，a/c 无记录视为到期
  }
  it('到期在前、未到期在后，组内保持插入序（稳定）', () => {
    const sorted = sortWrongByDue([w('a'), w('b'), w('c')], records)
    expect(sorted.map(q => q.id)).toEqual(['a', 'c', 'b'])
  })
  it('countDue 统计到期数', () => {
    expect(countDue([w('a'), w('b'), w('c')], records)).toBe(2)
    expect(countDue([], records)).toBe(0)
  })
  it('不修改原数组', () => {
    const list = [w('a'), w('b'), w('c')]
    sortWrongByDue(list, records)
    expect(list.map(q => q.id)).toEqual(['a', 'b', 'c'])
  })
})
