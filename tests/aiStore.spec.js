import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// 端侧 AI store：剖析/归纳结果 LRU 缓存 + 下载进度文案与完成轮询
// （沿用项目惯例：vi.stubGlobal 构造 Chrome API mock，不用 vi.mock 模块工厂）
import { useAiStore } from '../src/stores/ai'

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
})

afterEach(() => {
  // 轮询定时器是模块级共享变量，测试间必须显式停掉防止泄漏到下一用例
  useAiStore().stopDownloadPolling()
  vi.unstubAllGlobals()
  vi.useRealTimers()
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

describe('下载进度文案与完成轮询', () => {
  it('statusText：<1% 保留一位小数，≥1% 取整，0 不显示百分比', () => {
    const store = useAiStore()
    store.status = 'downloading'
    store.downloadProgress = 0
    expect(store.statusText).toBe('模型下载中')
    store.downloadProgress = 0.004
    expect(store.statusText).toBe('模型下载中 0.4%')
    store.downloadProgress = 0.0056
    expect(store.statusText).toBe('模型下载中 0.6%')
    store.downloadProgress = 0.5
    expect(store.statusText).toBe('模型下载中 50%')
  })

  it('后台下载无 monitor 时轮询感知完成：downloading → available', async () => {
    // 先装 fake timers 再触发检测：否则轮询 setInterval 会注册成真实定时器，advance 无效
    vi.useFakeTimers()
    vi.stubGlobal('LanguageModel', { availability: vi.fn(async () => 'downloading') })
    const store = useAiStore()
    await store.checkEnvironment()
    expect(store.status).toBe('downloading')

    LanguageModel.availability = vi.fn(async () => 'available')   // 模拟后台下载完成
    await vi.advanceTimersByTimeAsync(10000)
    expect(store.status).toBe('available')
    expect(store.downloadProgress).toBe(1)
  })
})
