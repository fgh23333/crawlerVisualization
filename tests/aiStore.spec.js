import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// 端侧 AI store：剖析/归纳结果 LRU 缓存（不依赖 Chrome API，只测画像与缓存纯逻辑）
import { useAiStore } from '../src/stores/ai'

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
})

describe('剖析缓存 analysisCache', () => {
  it('写入后可命中读取，且计数累加', () => {
    const store = useAiStore()
    expect(store.getCachedAnalysis('q1')).toBe('')
    store.recordAnalysis('q1', '考点：矛盾的特殊性')
    expect(store.getCachedAnalysis('q1')).toBe('考点：矛盾的特殊性')
    expect(store.profile.analysisCount).toBe(1)
  })

  it('练习作答后缀键与裸 id 键互不干扰', () => {
    const store = useAiStore()
    store.recordAnalysis('q1', '无作答版剖析')
    store.recordAnalysis('q1@AB', '针对作答 AB 的点评')
    expect(store.getCachedAnalysis('q1')).toBe('无作答版剖析')
    expect(store.getCachedAnalysis('q1@AB')).toBe('针对作答 AB 的点评')
  })

  it('LRU 超限淘汰最旧（上限 30 条）', () => {
    const store = useAiStore()
    for (let i = 0; i < 31; i++) store.recordAnalysis(`q${i}`, `剖析${i}`)
    expect(Object.keys(store.profile.analysisCache)).toHaveLength(30)
    expect(store.getCachedAnalysis('q0')).toBe('')      // 最旧被淘汰
    expect(store.getCachedAnalysis('q30')).toBe('剖析30') // 最新保留
  })

  it('超长文本截断到 2000 字，防止 localStorage 膨胀', () => {
    const store = useAiStore()
    store.recordAnalysis('q1', 'x'.repeat(5000))
    expect(store.getCachedAnalysis('q1')).toHaveLength(2000)
  })
})

describe('归纳缓存 summaryCache', () => {
  it('按签名读写，签名不同互不干扰', () => {
    const store = useAiStore()
    store.recordSummary('all|q1,q2|3', '马原 2 题…')
    store.recordSummary('wrong|q1|1', '错题 1 道…')
    expect(store.getCachedSummary('all|q1,q2|3')).toBe('马原 2 题…')
    expect(store.getCachedSummary('wrong|q1|1')).toBe('错题 1 道…')
    expect(store.getCachedSummary('all|q1,q3|0')).toBe('')
  })

  it('LRU 超限淘汰最旧（上限 5 条）', () => {
    const store = useAiStore()
    for (let i = 0; i < 6; i++) store.recordSummary(`sig${i}`, `归纳${i}`)
    expect(Object.keys(store.profile.summaryCache)).toHaveLength(5)
    expect(store.getCachedSummary('sig0')).toBe('')
    expect(store.getCachedSummary('sig5')).toBe('归纳5')
  })

  it('旧版本持久化数据无 summaryCache 字段时不抛错并自动补建', () => {
    const store = useAiStore()
    delete store.profile.summaryCache   // 模拟升级前写入 localStorage 的旧画像
    expect(store.getCachedSummary('sig')).toBe('')
    store.recordSummary('sig', '新归纳')
    expect(store.getCachedSummary('sig')).toBe('新归纳')
  })

  it('归纳文本截断到 4000 字', () => {
    const store = useAiStore()
    store.recordSummary('sig', 'y'.repeat(9000))
    expect(store.getCachedSummary('sig')).toHaveLength(4000)
  })
})
