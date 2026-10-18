import { describe, it, expect, vi, beforeEach } from 'vitest'

// 不 vi.mock loadJson：vitest 对「Promise.all 里并发动态 import + vi.mock」的拦截存在竞态
// （4 个 import('./loadJson') 只有第一个稳定命中 mock，其余走真实模块发真网络请求）。
// 改为拦截 fetch 层，让 quizGenerator → loadJson → localStorage 缓存 → 加权抽样整条链路真实跑通。
import generateQuiz from '../src/utils/quizGenerator'

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
