import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
    getJevConfig, setJevConfig, isJevEnabled,
    buildDecisionsPayload, askDecisions,
    buildWrongAnswerAnalysis, ERROR_CAUSE_LABELS, JEV_DEFAULT_ENDPOINT
} from '../src/utils/jev'

// Jev Decisions 客户端：契约组装 + fail-open 全路径 + BYOK 配置。
// fetch 一律 stub；响应形态取自 OpenRouter 官方 OpenAPI（answers map + type 判别）。
beforeEach(() => {
    localStorage.clear()
})

afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
})

const stubFetch = (impl) => {
    const fn = vi.fn(impl)
    vi.stubGlobal('fetch', fn)
    return fn
}

const okResponse = (body) => ({ ok: true, status: 200, json: async () => body })

const enable = (overrides = {}) => setJevConfig({ enabled: true, apiKey: 'sk-test', ...overrides })

// ── 配置（BYOK，localStorage） ──────────────────────────────

describe('getJevConfig / setJevConfig', () => {
    it('默认关闭、无 key、默认端点', () => {
        expect(getJevConfig()).toEqual({ enabled: false, apiKey: '', endpoint: JEV_DEFAULT_ENDPOINT })
        expect(isJevEnabled()).toBe(false)
    })

    it('局部更新合并保留其余字段', () => {
        enable({ endpoint: 'https://worker.example.com/jev' })
        setJevConfig({ apiKey: 'sk-new' }) // 只换 key
        const c = getJevConfig()
        expect(c).toEqual({ enabled: true, apiKey: 'sk-new', endpoint: 'https://worker.example.com/jev' })
    })

    it('清空 key 强制关闭（opt-in 不残留半开状态）', () => {
        enable()
        setJevConfig({ apiKey: '' })
        expect(getJevConfig().enabled).toBe(false)
        expect(isJevEnabled()).toBe(false)
    })

    it('损坏 JSON / 写入配额满均不抛错，读侧回落安全默认', () => {
        localStorage.setItem('jev_config', '{broken')
        expect(getJevConfig().enabled).toBe(false)
        enable()
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('QuotaExceeded') })
        expect(() => setJevConfig({ enabled: true })).not.toThrow()
    })
})

// ── 官方契约组装 ────────────────────────────────────────────

describe('buildDecisionsPayload', () => {
    it('扁平请求体：model + state + questions map，session_id 缺省不加', () => {
        const questions = { q1: { type: 'noul', instructions: 'x' } }
        const p = buildDecisionsPayload({ state: { a: 1 }, questions })
        expect(p).toEqual({ model: 'typesafe/jev-1.13', state: { a: 1 }, questions })
        expect(p).not.toHaveProperty('decisionsRequest') // SDK 包装名不得混入 REST body
    })

    it('带 sessionId 时序列化为字符串', () => {
        const p = buildDecisionsPayload({ state: 's', questions: {}, sessionId: 123 })
        expect(p.session_id).toBe('123')
    })
})

// ── askDecisions fail-open 全路径 ──────────────────────────

const SAMPLE_QUESTIONS = {
    error_cause: {
        type: 'choice',
        instructions: '判断错因',
        criteria: { concept_confusion: '混淆概念', careless: '粗心' }
    },
    need_explain: {
        type: 'noul',
        instructions: '需要讲解吗？',
        criteria: { true: '是', false: '否' }
    }
}

describe('askDecisions', () => {
    it('未开启 / 无 key：不发起请求直接返回 null', async () => {
        const fetchMock = stubFetch(async () => okResponse({}))
        expect(await askDecisions({ state: {}, questions: SAMPLE_QUESTIONS })).toBeNull()
        setJevConfig({ enabled: true }) // 开了但没 key
        expect(await askDecisions({ state: {}, questions: SAMPLE_QUESTIONS })).toBeNull()
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('成功：noul 数值 + choice 选项 + probabilities 透传', async () => {
        enable()
        stubFetch(async (url, init) => {
            expect(url).toBe(JEV_DEFAULT_ENDPOINT)
            expect(init.headers.Authorization).toBe('Bearer sk-test')
            const body = JSON.parse(init.body)
            expect(body.model).toBe('typesafe/jev-1.13')
            expect(body.questions).toHaveProperty('error_cause')
            return okResponse({
                model: 'typesafe/jev-1.13',
                answers: {
                    error_cause: { type: 'choice', choice: 'careless', probabilities: { careless: 0.71, concept_confusion: 0.29 } },
                    need_explain: { type: 'noul', noul: 0.12 }
                },
                usage: { inputTokens: 400, outputTokens: 0 }
            })
        })
        const out = await askDecisions({ state: { stem: 'x' }, questions: SAMPLE_QUESTIONS })
        expect(out.error_cause).toEqual({ value: 'careless', probabilities: { careless: 0.71, concept_confusion: 0.29 } })
        expect(out.need_explain).toEqual({ value: 0.12 })
    })

    it('choice 越界（不在 criteria 内）→ 该项丢弃，其余保留；全部无效 → null', async () => {
        enable()
        stubFetch(async () => okResponse({
            answers: {
                error_cause: { type: 'choice', choice: 'made_up_option' },
                need_explain: { type: 'noul', noul: 0.4 }
            }
        }))
        const out = await askDecisions({ state: {}, questions: SAMPLE_QUESTIONS })
        expect(out).toEqual({ need_explain: { value: 0.4 } })

        stubFetch(async () => okResponse({ answers: { error_cause: { type: 'choice', choice: 'made_up_option' } } }))
        expect(await askDecisions({ state: {}, questions: SAMPLE_QUESTIONS })).toBeNull()
    })

    it('type 判别不符 / 非有限数值 → 无效', async () => {
        enable()
        stubFetch(async () => okResponse({
            answers: {
                error_cause: { type: 'noul', noul: 0.9 },       // 期望 choice
                need_explain: { type: 'noul', noul: 'high' }    // noul 非数值
            }
        }))
        expect(await askDecisions({ state: {}, questions: SAMPLE_QUESTIONS })).toBeNull()
    })

    it('非 2xx / 损坏 JSON / 网络错误 / 缺 answers → null 且不 reject', async () => {
        enable()
        stubFetch(async () => ({ ok: false, status: 429, json: async () => ({}) }))
        expect(await askDecisions({ state: {}, questions: SAMPLE_QUESTIONS })).toBeNull()

        stubFetch(async () => ({ ok: true, status: 200, json: async () => { throw new Error('bad json') } }))
        expect(await askDecisions({ state: {}, questions: SAMPLE_QUESTIONS })).toBeNull()

        stubFetch(async () => { throw new TypeError('network down') })
        expect(await askDecisions({ state: {}, questions: SAMPLE_QUESTIONS })).toBeNull()

        stubFetch(async () => okResponse({ model: 'x' })) // 无 answers 字段
        expect(await askDecisions({ state: {}, questions: SAMPLE_QUESTIONS })).toBeNull()
    })

    it('超时 abort → null（fail-open 计时兜底）', async () => {
        enable()
        // fetch 永不 resolve，收到 abort 信号以 AbortError 拒绝（模拟真实 fetch 语义）
        stubFetch((_url, init) => new Promise((_res, rej) => {
            init.signal.addEventListener('abort', () => {
                rej(Object.assign(new Error('aborted'), { name: 'AbortError' }))
            })
        }))
        expect(await askDecisions({ state: {}, questions: SAMPLE_QUESTIONS, timeoutMs: 20 })).toBeNull()
    })
})

// ── 业务决策槽：答错并行两问 ────────────────────────────────

describe('buildWrongAnswerAnalysis', () => {
    it('state 只含单题字段（红线：不带全量画像），两问并行', () => {
        const question = {
            id: 'q1',
            questionStem: '社会存在是指()',
            option: ['A. 社会意识', 'B. 物质生活条件'],
            answer: 'B',
            abbreviationSubject: 'Marx',
            typeLabel: '单选题'
        }
        const { state, questions } = buildWrongAnswerAnalysis({ question, userAnswer: 'A', timeSpentMs: 41000 })
        // 只上送单题：白名单字段断言，无任何用户记录/画像键
        expect(Object.keys(state).sort()).toEqual(
            ['correctAnswer', 'options', 'questionType', 'scenario', 'secondsSpent', 'stem', 'subject', 'userAnswer'].sort())
        expect(state.secondsSpent).toBe(41)
        expect(state.userAnswer).toBe('A')

        expect(questions.error_cause.type).toBe('choice')
        expect(Object.keys(questions.error_cause.criteria)).toEqual(Object.keys(ERROR_CAUSE_LABELS))
        expect(questions.need_explain.type).toBe('noul')
    })

    it('timeSpentMs 缺失不阻塞组装', () => {
        const { state } = buildWrongAnswerAnalysis({
            question: { questionStem: 'x', option: [], answer: 'A' }, userAnswer: 'B'
        })
        expect(state.secondsSpent).toBeNull()
    })
})
