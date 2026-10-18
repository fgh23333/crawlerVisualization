import { describe, it, expect, vi, beforeEach } from 'vitest'

// 题库加载器：markHighFreq 高频标记规则 + localStorage 缓存行为
// import.meta.env.VITE_DATA_URL 在测试环境为空 → DATA_URL=''，checkVersion 直接跳过
import { loadQuestionBank, loadExamPaper } from '../src/utils/loadJson'

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  localStorage.clear()
})

function respondOnce(data) {
  fetchMock.mockImplementationOnce(async () => ({ ok: true, json: async () => data }))
}

describe('loadQuestionBank / markHighFreq 高频标记', () => {
  it('带权样本 ≥20：按 max(10, p85) 阈值标记 isHighFreq', async () => {
    // 25 题 appearCount = 1..25 → counts 升序 p85 = counts[21] = 22 → 阈值 22 → 4 题标高频
    const data = Array.from({ length: 25 }, (_, i) => ({
      id: `q_${i + 1}`,
      questionStem: `题${i + 1}`,
      option: [],
      answer: 'x',
      appearCount: i + 1,
    }))
    respondOnce(data)
    const qs = await loadQuestionBank('Marx', 'subject')
    const high = qs.filter((q) => q.isHighFreq)
    expect(high.map((q) => q.appearCount).sort((a, b) => a - b)).toEqual([22, 23, 24, 25])
    expect(qs.filter((q) => !q.isHighFreq)).toHaveLength(21)
  })

  it('p85 低于 10 时阈值抬到 10（早期轮数不足）', async () => {
    // 25 题全部 appearCount = 1..9 → p85 = 8 → 阈值 max(10,8) = 10 → 无人达标
    const data = Array.from({ length: 25 }, (_, i) => ({
      id: `q_${i}`,
      questionStem: `题${i}`,
      option: [],
      answer: 'x',
      appearCount: (i % 9) + 1,
    }))
    respondOnce(data)
    const qs = await loadQuestionBank('Marx', 'subject')
    expect(qs.every((q) => q.isHighFreq === false)).toBe(true)
  })

  it('带权样本 <20（旧数据未打标）：全部不标记', async () => {
    const data = Array.from({ length: 19 }, (_, i) => ({
      id: `q_${i}`,
      questionStem: `题${i}`,
      option: [],
      answer: 'x',
      appearCount: 100, // 权重再高也不标
    }))
    respondOnce(data)
    const qs = await loadQuestionBank('Marx', 'subject')
    expect(qs.every((q) => q.isHighFreq === false)).toBe(true)
  })

  it('无 appearCount 字段的旧缓存数据安全通过（不抛错不标记）', async () => {
    respondOnce([{ id: 'a', questionStem: 's', option: [], answer: 'x' }])
    const qs = await loadQuestionBank('Marx', 'subject')
    expect(qs[0].isHighFreq).toBe(false)
  })
})

describe('localStorage 缓存', () => {
  it('首次拉取走网络并写缓存，第二次命中缓存不再 fetch', async () => {
    const data = [{ id: 'a', questionStem: 's', option: [], answer: 'x' }]
    respondOnce(data)
    const first = await loadExamPaper('Marx', '1')
    expect(first).toEqual(data)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const second = await loadExamPaper('Marx', '1')
    expect(second).toEqual(data)
    expect(fetchMock).toHaveBeenCalledTimes(1) // 命中缓存
    expect(localStorage.getItem('qb__cura_Marx_1_json')).toBeTruthy()
  })

  it('缓存损坏时回退网络重新拉取', async () => {
    localStorage.setItem('qb__cura_Marx_1_json', '{broken json')
    const data = [{ id: 'a', questionStem: 's', option: [], answer: 'x' }]
    respondOnce(data)
    const qs = await loadExamPaper('Marx', '1')
    expect(qs).toEqual(data)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('HTTP 非 2xx 抛错（而不是返回 undefined 崩在下游）', async () => {
    fetchMock.mockImplementationOnce(async () => ({ ok: false, status: 404, json: async () => ({}) }))
    await expect(loadExamPaper('Marx', '999')).rejects.toThrow('404')
  })
})
