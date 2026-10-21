import { describe, it, expect, vi, beforeEach } from 'vitest'

// Chrome 内置 AI 工具层：双形态兼容 / 状态映射 / 会话生命周期 / 流式切片 / 业务 Prompt 构造
// happy-dom 无 LanguageModel/Summarizer 全局对象 → 全部用 vi.stubGlobal 构造 mock
// （沿用项目惯例：不用 vi.mock 模块工厂，避免并发动态 import 竞态）
import {
  getPromptAPI, getSummarizerAPI, checkPromptAvailability, checkSummarizerAvailability,
  createChatSession, destroySession, streamChat,
  GEMMA_SYSTEM_PROMPT, buildPersonalizedSystemPrompt,
  buildQuestionAnalysisPrompt, buildFavoritesSummaryPrompt,
} from '../src/utils/builtinAI'

// ======================== mock 基建 ========================

const encoder = new TextEncoder()

// 模拟 ReadableStream：按 chunks 逐段返回；元素为 string（自动编码）或 Uint8Array（直传字节，用于拆字节用例）
function fakeStream(chunks) {
  let i = 0
  return {
    getReader() {
      return {
        read: async () => {
          if (i < chunks.length) {
            const c = chunks[i++]
            return { done: false, value: typeof c === 'string' ? encoder.encode(c) : c }
          }
          return { done: true, value: undefined }
        },
      }
    },
  }
}

// 模拟原生会话：promptStreaming 返回 fakeStream
function fakeSession(chunks) {
  return {
    promptStreaming: vi.fn(() => fakeStream(chunks)),
    destroy: vi.fn(),
  }
}

beforeEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

// ======================== 用例 ========================

describe('API 入口双形态兼容', () => {
  it('优先返回新标准 window.LanguageModel', () => {
    const modern = { availability: async () => 'available' }
    vi.stubGlobal('LanguageModel', modern)
    vi.stubGlobal('ai', { languageModel: { marker: 1 } })
    expect(getPromptAPI()).toBe(modern)
  })

  it('无新形态时回退旧形态 window.ai.languageModel', () => {
    // happy-dom 默认无 window.LanguageModel / window.ai，仅 stub 旧形态
    vi.stubGlobal('ai', { languageModel: { marker: 2 } })
    expect(getPromptAPI()).toEqual({ marker: 2 })
    vi.stubGlobal('ai', { summarizer: { marker: 3 } })
    expect(getSummarizerAPI()).toEqual({ marker: 3 })
  })

  it('两种形态均不存在 → 返回 null 且判定不支持', async () => {
    expect(getPromptAPI()).toBeNull()
    expect(getSummarizerAPI()).toBeNull()
    expect(await checkPromptAvailability()).toBe('unsupported')
  })
})

describe('availability 状态映射', () => {
  it('四种原始状态逐一映射为项目状态机取值', async () => {
    const cases = [
      ['unavailable', 'unsupported'],
      ['downloadable', 'after-download'],
      ['downloading', 'downloading'],
      ['available', 'available'],
    ]
    for (const [raw, mapped] of cases) {
      vi.stubGlobal('LanguageModel', { availability: async () => raw })
      expect(await checkPromptAvailability()).toBe(mapped)
    }
  })

  it('Summarizer 独立检测同样映射；接口调用异常按不支持处理', async () => {
    vi.stubGlobal('Summarizer', { availability: async () => 'downloadable' })
    expect(await checkSummarizerAvailability()).toBe('after-download')
    vi.stubGlobal('Summarizer', { availability: async () => { throw new Error('boom') } })
    expect(await checkSummarizerAvailability()).toBe('unsupported')
  })
})

describe('createChatSession 会话创建', () => {
  it('带 initialPrompts / monitor / samplingMode 调用 create', async () => {
    const session = fakeSession(['ok'])
    const createMock = vi.fn(async () => session)
    vi.stubGlobal('LanguageModel', { create: createMock })

    await createChatSession({ systemPrompt: '人设', onDownloadProgress: () => {} })

    const arg = createMock.mock.calls[0][0]
    expect(arg.samplingMode).toBe('most-predictable') // 贪婪采样激活 MTP 投机解码
    expect(arg.initialPrompts).toEqual([{ role: 'system', content: '人设' }])
    expect(typeof arg.monitor).toBe('function')
  })

  it('samplingMode 抛 TypeError（非 OT 环境）→ 自动去参重试成功', async () => {
    const session = fakeSession(['ok'])
    const createMock = vi.fn()
      .mockImplementationOnce(async () => { throw new TypeError('unknown property') })
      .mockImplementationOnce(async () => session)
    vi.stubGlobal('LanguageModel', { create: createMock })

    await createChatSession({ systemPrompt: 'x' })

    expect(createMock).toHaveBeenCalledTimes(2)
    expect(createMock.mock.calls[0][0].samplingMode).toBe('most-predictable')
    expect(createMock.mock.calls[1][0].samplingMode).toBeUndefined()
  })

  it('monitor 监听 downloadprogress 并回调 e.loaded 进度', async () => {
    let progressCb = null
    const fakeMon = {
      addEventListener: (name, cb) => { if (name === 'downloadprogress') progressCb = cb },
    }
    const createMock = vi.fn(async (opts) => { opts.monitor(fakeMon); return fakeSession([]) })
    vi.stubGlobal('LanguageModel', { create: createMock })
    const onProgress = vi.fn()

    await createChatSession({ systemPrompt: 'x', onDownloadProgress: onProgress })
    progressCb({ loaded: 0.42 })

    expect(onProgress).toHaveBeenCalledWith(0.42)
  })

  it('destroySession 对 null / 已销毁会话均安全不抛', () => {
    expect(() => destroySession(null)).not.toThrow()
    expect(() => destroySession({ destroy: () => { throw new Error('gone') } })).not.toThrow()
  })
})

describe('streamChat 流式消费', () => {
  it('按序回调 onDelta 并返回完整拼接文本', async () => {
    const session = fakeSession(['你好', '，', '世界'])
    const deltas = []
    const full = await streamChat(session, '问题', { onDelta: (c, f) => deltas.push([c, f]) })

    expect(full).toBe('你好，世界')
    expect(deltas).toEqual([
      ['你好', '你好'],
      ['，', '你好，'],
      ['世界', '你好，世界'],
    ])
  })

  it('UTF-8 多字节字符拆在两个 chunk 边界不乱码', async () => {
    const bytes = encoder.encode('马原') // 6 字节：马 3 + 原 3
    const session = fakeSession([bytes.slice(0, 3), bytes.slice(3)])
    const deltas = []
    const full = await streamChat(session, 'x', { onDelta: (c) => deltas.push(c) })

    expect(full).toBe('马原')
    expect(deltas).toEqual(['马', '原'])
  })

  it('中止时上抛 name 为 AbortError 的错误（已拼接内容由调用方保留）', async () => {
    const abortingStream = {
      getReader: () => ({
        read: async () => {
          const e = new Error('aborted')
          e.name = 'AbortError'
          throw e
        },
      }),
    }
    const session = { promptStreaming: () => abortingStream }
    await expect(streamChat(session, 'x')).rejects.toMatchObject({ name: 'AbortError' })
  })
})

describe('业务 Prompt 构造', () => {
  const question = {
    questionStem: '唯物史观认为，社会存在的核心是？',
    option: ['地理环境', '人口因素', '物质生产方式', '政治法律制度'],
    answer: 'C',
  }

  it('剖析 prompt 含题型/科目/题干/选项/正确答案/用户作答', () => {
    const prompt = buildQuestionAnalysisPrompt(question, {
      typeLabel: '单选', subjectLabel: '马原', userAnswer: 'A',
    })
    expect(prompt).toContain('科目：马原')
    expect(prompt).toContain('题型：单选')
    expect(prompt).toContain(question.questionStem)
    expect(prompt).toContain('C、物质生产方式')
    expect(prompt).toContain('正确答案：C')
    expect(prompt).toContain('我的作答：A')
  })

  it('无用户作答时不含作答字段', () => {
    const prompt = buildQuestionAnalysisPrompt(question, { typeLabel: '单选' })
    expect(prompt).not.toContain('我的作答')
  })

  it('归纳 prompt 含分组统计且超长题干截断到 60 字', () => {
    const longStem = '题'.repeat(100)
    const prompt = buildFavoritesSummaryPrompt([
      { subject: '马原', total: 12, highFreq: 3, errorTotal: 7, sampleStems: [longStem, '短题干'] },
      { subject: '党史', total: 5, highFreq: 0, errorTotal: 2, sampleStems: [] },
    ])
    expect(prompt).toContain('【马原】共 12 题')
    expect(prompt).toContain('高频 3 题')
    expect(prompt).toContain('累计错 7 次')
    expect(prompt).toContain('【党史】共 5 题')
    expect(prompt).toContain('题'.repeat(60))
    expect(prompt).not.toContain('题'.repeat(61)) // 截断生效
    expect(prompt).toContain('「短题干」')
  })

  it('个性化人设：注入近期关注科目与解析计数；无画像数据原样返回', () => {
    const profile = { subjectInterest: { Marx: 12, CCPH: 5 }, analysisCount: 8, chatTurns: 20 }
    const personalized = buildPersonalizedSystemPrompt(GEMMA_SYSTEM_PROMPT, profile)
    expect(personalized).toContain('马原×12')
    expect(personalized).toContain('解析 8 道')
    expect(personalized).toContain(GEMMA_SYSTEM_PROMPT)

    // 无有效画像 → 原样返回基础人设
    expect(buildPersonalizedSystemPrompt(GEMMA_SYSTEM_PROMPT, { subjectInterest: {}, analysisCount: 0 }))
      .toBe(GEMMA_SYSTEM_PROMPT)
  })
})
