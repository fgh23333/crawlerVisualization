import { describe, it, expect, vi, beforeEach } from 'vitest'

// 不 vi.mock loadJson：vitest 对「Promise.all 里并发动态 import + vi.mock」的拦截存在竞态
// （4 个 import('./loadJson') 只有第一个稳定命中 mock，其余走真实模块发真网络请求）。
// 改为拦截 fetch 层，让 quizGenerator → loadJson → localStorage 缓存 → 加权抽样整条链路真实跑通。
import generateQuiz, { weightedSample } from '../src/utils/quizGenerator'

// 题库桩：60 题，前 30 题 appearCount=1000（官方高频），后 30 题 appearCount=1
// 对数压缩后权重比 ≈ (1+ln1001):(1+ln2) ≈ 7.9:1.7 ≈ 4.7:1
const N = 60
const makeQ = (i, appearCount) => ({
  id: `q_${i}`,
  questionStem: `第${i}题`,
  option: ['A', 'B', 'C', 'D'],
  answer: 'A',
  appearCount,
})
const bank = {}
for (const type of ['singleChoice', 'multipleChoice', 'fillingBlank', 'rightWrong']) {
  bank[type] = Array.from({ length: N }, (_, i) =>
    makeQ(`${type}_${i}`, i < N / 2 ? 1000 : 1)
  )
}

const fetchMock = vi.fn(async (input) => {
  const m = /\/rewrite\/Marx_(\w+)\.json/.exec(String(input))
  if (m && bank[m[1]]) return { ok: true, json: async () => bank[m[1]] }
  return { ok: false, status: 404, json: async () => ({}) }
})

beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('fetch', fetchMock)
})

// 权重随机练习是 issue 驱动的核心功能（马院抽题带权重）
describe('quizGenerator 权重随机抽题', () => {
  it('默认加权：高频题（appearCount=1000）抽样占比显著高于低频题', async () => {
    const draws = 400
    const perDraw = 24
    let highHits = 0
    let total = 0
    for (let d = 0; d < draws; d++) {
      const quiz = await generateQuiz('Marx', { single: perDraw, multiple: 0, blank: 0, trueFalse: 0 })
      expect(quiz).toHaveLength(perDraw)
      for (const q of quiz) {
        total++
        if (q.appearCount === 1000) highHits++
      }
    }
    const ratio = highHits / total
    // 期望 ≈ 4.7/5.7 ≈ 82%；放宽到 65%~95% 消除抽样噪声导致的偶发红
    expect(ratio).toBeGreaterThan(0.65)
    expect(ratio).toBeLessThan(0.95)
  })

  it('weighted:false 切回均匀：高低频占比接近 1:1', async () => {
    const draws = 400
    const perDraw = 24
    let highHits = 0
    let total = 0
    for (let d = 0; d < draws; d++) {
      const quiz = await generateQuiz(
        'Marx',
        { single: perDraw, multiple: 0, blank: 0, trueFalse: 0 },
        { weighted: false }
      )
      for (const q of quiz) {
        total++
        if (q.appearCount === 1000) highHits++
      }
    }
    const ratio = highHits / total
    // 期望 50%；±12pt 容差
    expect(ratio).toBeGreaterThan(0.38)
    expect(ratio).toBeLessThan(0.62)
  })

  it('均匀模式同题型不重复（无放回）', async () => {
    const quiz = await generateQuiz(
      'Marx',
      { single: N, multiple: 0, blank: 0, trueFalse: 0 },
      { weighted: false }
    )
    expect(quiz).toHaveLength(N)
    expect(new Set(quiz.map((q) => q.id)).size).toBe(N)
  })

  it('加权模式同样无放回', async () => {
    const quiz = await generateQuiz('Marx', { single: N, multiple: 0, blank: 0, trueFalse: 0 })
    expect(new Set(quiz.map((q) => q.id)).size).toBe(N)
  })

  it('请求题量超过池大小时返回全量', async () => {
    const quiz = await generateQuiz('Marx', { single: 999, multiple: 0, blank: 0, trueFalse: 0 })
    expect(quiz).toHaveLength(N)
  })

  it('generateQuiz 按四种题型取数并合并', async () => {
    const quiz = await generateQuiz('Marx', { single: 5, multiple: 4, blank: 3, trueFalse: 2 })
    expect(quiz).toHaveLength(14)
    // id 形如 q_singleChoice_3，取第二段判题型
    const stems = quiz.map((q) => q.id.split('_')[1])
    expect(stems.filter((s) => s === 'singleChoice')).toHaveLength(5)
    expect(stems.filter((s) => s === 'multipleChoice')).toHaveLength(4)
    expect(stems.filter((s) => s === 'rightWrong')).toHaveLength(2)
    expect(stems.filter((s) => s === 'fillingBlank')).toHaveLength(3)
  })

  it('题库为空时返回空数组（科目不存在的兜底）', async () => {
    const quiz = await generateQuiz('NoSuch', { single: 5 })
    expect(quiz).toEqual([])
  })
})

// 个性化权重：userRecords 透传后掌握度乘子叠加在 appearCount 基础权重上
// 基线（无 records）高频占比实测 ≈ 0.77：k/N=0.4 的无放回加权抽样存在饱和效应，
// 占比不等于权重比例公式算出的 0.82，期望值以大样本模拟为准
describe('quizGenerator 个性化抽题权重', () => {
  const makeRecords = (highMastery, lowMastery) => {
    const records = {}
    for (let i = 0; i < N; i++) {
      // id 必须与 bank 的 `q_` 前缀一致，否则 records 永不命中、乘子恒 1
      const id = `q_singleChoice_${i}`
      records[id] = { questionId: id, attempted: 5, mastery: i < N / 2 ? highMastery : lowMastery }
    }
    return records
  }
  const sample = async (records) => {
    let highHits = 0, total = 0
    for (let d = 0; d < 400; d++) {
      const quiz = await generateQuiz('Marx', { single: 24, multiple: 0, blank: 0, trueFalse: 0 }, undefined, records)
      for (const q of quiz) {
        total++
        if (q.appearCount === 1000) highHits++
      }
    }
    return highHits / total
  }

  it('高频题已掌握(0.95)、低频题薄弱(0.05) → 高频占比显著跌破基线', async () => {
    // 乘子 0.46 / 1.54 → 有效权重 3.64:2.61；大样本模拟期望 ≈ 0.56
    const ratio = await sample(makeRecords(0.95, 0.05))
    expect(ratio).toBeGreaterThan(0.42)
    expect(ratio).toBeLessThan(0.68)
  })

  it('高频题薄弱(0.05)、低频题已掌握(0.95) → 高频占比逼近全占', async () => {
    // 乘子 1.54 / 0.46 → 有效权重 12.2:0.78；大样本模拟期望 ≈ 0.90
    const ratio = await sample(makeRecords(0.05, 0.95))
    expect(ratio).toBeGreaterThan(0.82)
    expect(ratio).toBeLessThan(0.96)
  })

  it('records 显式传 null：与不传完全一致（新用户基线不变）', async () => {
    const quiz = await generateQuiz('Marx', { single: 24, multiple: 0, blank: 0, trueFalse: 0 }, undefined, null)
    expect(quiz).toHaveLength(24)
  })
})

// weightedSample：自备题池的通用加权抽样（ncre3 理论随机练习在用），无 fetch 链路
describe('weightedSample 自备题池加权抽样', () => {
  const N = 40
  // ncre3 题无 appearCount → 基础权重退化为均匀基数，个性化只来自掌握度乘子
  const pool = Array.from({ length: N }, (_, i) => ({
    id: `t_${i}`, questionStem: `第${i}题`, option: ['A', 'B', 'C', 'D'], answer: 'A',
  }))
  const makeRecords = (weakFirstHalf) => {
    const records = {}
    for (let i = 0; i < N; i++) {
      records[`t_${i}`] = {
        questionId: `t_${i}`, attempted: 5,
        mastery: (i < N / 2) === weakFirstHalf ? 0.05 : 0.95,
      }
    }
    return records
  }
  const weakFraction = (records) => {
    let weak = 0, total = 0
    for (let d = 0; d < 400; d++) {
      for (const q of weightedSample(pool, 20, records)) {
        total++
        if (Number(q.id.slice(2)) < N / 2) weak++
      }
    }
    return weak / total
  }

  it('空池 / 非数组 / 非法数量一律返回空数组', () => {
    expect(weightedSample([], 20)).toEqual([])
    expect(weightedSample(null, 20)).toEqual([])
    expect(weightedSample(pool, 0)).toEqual([])
    expect(weightedSample(pool, -5)).toEqual([])
    expect(weightedSample(pool, NaN)).toEqual([])
  })

  it('请求超池大小时返回全量且不重复', () => {
    const full = weightedSample(pool, 999, null)
    expect(full).toHaveLength(N)
    expect(new Set(full.map((q) => q.id)).size).toBe(N)
  })

  it('无 records（无 appearCount）：等价均匀抽样，前后两半各约 50%', () => {
    const ratio = weakFraction(null)
    expect(ratio).toBeGreaterThan(0.40)
    expect(ratio).toBeLessThan(0.60)
  })

  it('掌握度乘子生效：薄弱半区（mastery 0.05）被显著加权 ≈ 70%', () => {
    const ratio = weakFraction(makeRecords(true))
    expect(ratio).toBeGreaterThan(0.60)
    expect(ratio).toBeLessThan(0.80)
  })
})
