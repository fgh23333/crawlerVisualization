import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
    getJevConfig, setJevConfig, isJevEnabled,
    buildDecisionsPayload, askDecisions,
    buildWrongAnswerAnalysis, ERROR_CAUSE_LABELS, JEV_DEFAULT_ENDPOINT, CLEF_ENDPOINT,
    toChromeSchema, fromChromeResult, probeChromeDecisions, askDecisionsChrome
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

const enable = (overrides = {}) => setJevConfig({ enabled: true, provider: 'openrouter', apiKey: 'sk-test', ...overrides })

// ── 配置（clef 免密钥 / openrouter BYOK，localStorage） ─────

describe('getJevConfig / setJevConfig', () => {
    it('默认启用、clef 通道、无 key、同域端点（前端已无开关，默认即开）', () => {
        expect(getJevConfig()).toEqual({ enabled: true, provider: 'clef', apiKey: '', endpoint: CLEF_ENDPOINT })
        expect(isJevEnabled()).toBe(true)
        // 显式关闭过的老配置仍被尊重
        localStorage.setItem('jev_config', JSON.stringify({ enabled: false }))
        expect(getJevConfig().enabled).toBe(false)
        expect(isJevEnabled()).toBe(false)
    })

    it('旧配置迁移：有 key 无 provider 字段 → openrouter；无 key → clef 默认', () => {
        localStorage.setItem('jev_config', JSON.stringify({ enabled: true, apiKey: 'sk-or-old', endpoint: JEV_DEFAULT_ENDPOINT }))
        const c = getJevConfig()
        expect(c.provider).toBe('openrouter')
        expect(c.enabled).toBe(true)
        expect(c.endpoint).toBe(JEV_DEFAULT_ENDPOINT)

        localStorage.setItem('jev_config', JSON.stringify({ enabled: true }))
        const c2 = getJevConfig()
        expect(c2.provider).toBe('clef')
        expect(c2.endpoint).toBe(CLEF_ENDPOINT)
    })

    it('局部更新合并保留其余字段', () => {
        enable({ endpoint: 'https://worker.example.com/jev' })
        setJevConfig({ apiKey: 'sk-new' }) // 只换 key
        const c = getJevConfig()
        expect(c).toEqual({ enabled: true, provider: 'openrouter', apiKey: 'sk-new', endpoint: 'https://worker.example.com/jev' })
    })

    it('openrouter 清空 key 强制关闭（不残留半开状态）；clef 无 key 也可启用', () => {
        enable()
        setJevConfig({ apiKey: '' })
        expect(getJevConfig().enabled).toBe(false)
        expect(isJevEnabled()).toBe(false)

        setJevConfig({ enabled: true, provider: 'clef' })
        expect(isJevEnabled()).toBe(true)
    })

    it('切通道未显式给端点时，端点随新通道重置', () => {
        enable({ endpoint: 'https://my-proxy.example/decisions' })
        setJevConfig({ provider: 'clef' }) // 切到 clef，端点未给 → 重置默认
        expect(getJevConfig().endpoint).toBe(CLEF_ENDPOINT)
        setJevConfig({ provider: 'openrouter' }) // 切回同理
        expect(getJevConfig().endpoint).toBe(JEV_DEFAULT_ENDPOINT)
        // 但显式给的端点不丢
        setJevConfig({ provider: 'clef', endpoint: 'https://my-proxy.example/decisions' })
        expect(getJevConfig().endpoint).toBe('https://my-proxy.example/decisions')
    })

    it('损坏 JSON / 写入配额满均不抛错，读侧回落安全默认', () => {
        localStorage.setItem('jev_config', '{broken')
        expect(getJevConfig().enabled).toBe(true) // 回落到空配置：默认启用 clef
        enable()
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('QuotaExceeded') })
        expect(() => setJevConfig({ enabled: true })).not.toThrow()
    })
})

// ── 官方契约组装 ────────────────────────────────────────────

describe('buildDecisionsPayload', () => {
    const questions = { q1: { type: 'noul', instructions: 'x' } }

    it('clef 通道（默认）：短选择器 model，session_id 不进 body（契约无此字段）', () => {
        const p = buildDecisionsPayload({ state: { a: 1 }, questions, sessionId: 123 })
        expect(p).toEqual({ model: 'clef-flash', state: { a: 1 }, questions })
        expect(p).not.toHaveProperty('session_id')
        expect(p).not.toHaveProperty('decisionsRequest') // SDK 包装名不得混入 REST body
    })

    it('openrouter 通道：完整模型 id + session_id 序列化为字符串', () => {
        const p = buildDecisionsPayload({ state: 's', questions: {}, sessionId: 123, provider: 'openrouter' })
        expect(p.model).toBe('typesafe/jev-1.13')
        expect(p.session_id).toBe('123')
        expect(p).not.toHaveProperty('decisionsRequest')
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
    it('显式关闭 / openrouter 无 key：不发起请求直接返回 null', async () => {
        const fetchMock = stubFetch(async () => okResponse({}))
        setJevConfig({ enabled: false }) // 前端已无开关，唯一关闭途径是本机配置
        expect(await askDecisions({ state: {}, questions: SAMPLE_QUESTIONS })).toBeNull()
        setJevConfig({ enabled: true, provider: 'openrouter' }) // 开了但没 key
        expect(await askDecisions({ state: {}, questions: SAMPLE_QUESTIONS })).toBeNull()
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('clef 通道：同域端点、免 Authorization、model=clef-flash、无 session_id；未绑定 503 → null', async () => {
        setJevConfig({ enabled: true, provider: 'clef' })
        stubFetch(async (url, init) => {
            expect(url).toBe(CLEF_ENDPOINT)
            expect(init.headers.Authorization).toBeUndefined()
            const body = JSON.parse(init.body)
            expect(body.model).toBe('clef-flash')
            expect(body).not.toHaveProperty('session_id')
            return okResponse({
                model: 'clef-flash',
                answers: {
                    error_cause: { type: 'choice', choice: 'careless', probabilities: { careless: 1 }, confidence: 0.9 },
                    need_explain: { type: 'noul', noul: 0.2 }
                },
                usage: { input_tokens: 345, output_tokens: 0 }
            })
        })
        const out = await askDecisions({ state: {}, questions: SAMPLE_QUESTIONS, sessionId: 'practice-1' })
        expect(out.error_cause).toEqual({ value: 'careless', probabilities: { careless: 1 } })
        expect(out.need_explain).toEqual({ value: 0.2 })

        // Pages Function 未绑定 Workers AI 时 503，页面侧 fail-open
        stubFetch(async () => ({ ok: false, status: 503, json: async () => ({}) }))
        expect(await askDecisions({ state: {}, questions: SAMPLE_QUESTIONS })).toBeNull()
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

// ── 端侧通道（Chrome 157+ Decisions API，休眠）──────────────
// 契约映射按 2026-11-04 Chrome 157 本机实证：boolean 禁 options、choice 必带 options、
// score options 用数字 label、响应 label/confidence/probabilities/expectedScore。

const SYSTEM_ONE_QUESTIONS = {
    error_cause: {
        type: 'choice',
        instructions: '判断错因',
        criteria: { concept_confusion: '混淆概念', careless: '粗心' }
    },
    need_explain: { type: 'noul', instructions: '需要讲解吗？' },
    urgency: { type: 'score', instructions: '复习紧迫度？', criteria: ['不急', '一般', '很急'] }
}

describe('toChromeSchema（System One → 端侧形态）', () => {
    it('三原语映射：choice→options 数组 / noul→boolean 无 options / score→数字 label', () => {
        const schema = toChromeSchema({ state: { scenario: '错因判断场景' }, questions: SYSTEM_ONE_QUESTIONS })
        expect(schema.context).toBe('错因判断场景')
        expect(schema.expectedInputs).toEqual([{ type: 'text', languages: ['zh'] }]) // 默认 zh：中文覆盖前保持休眠语义
        expect(schema.questions).toHaveLength(3)
        const choice = schema.questions.find(q => q.id === 'error_cause')
        expect(choice).toEqual({
            id: 'error_cause', type: 'choice', prompt: '判断错因',
            options: [
                { label: 'concept_confusion', description: '混淆概念' },
                { label: 'careless', description: '粗心' }
            ]
        })
        const bool = schema.questions.find(q => q.id === 'need_explain')
        expect(bool).toEqual({ id: 'need_explain', type: 'boolean', prompt: '需要讲解吗？' })
        expect(bool).not.toHaveProperty('options') // 157 实测：boolean 带 options 直接 TypeError
        const score = schema.questions.find(q => q.id === 'urgency')
        expect(score.options).toEqual([
            { label: '1', description: '不急' }, { label: '2', description: '一般' }, { label: '3', description: '很急' }
        ])
    })

    it('scenario 缺省时 context 用兜底文案；languages 可显式指定', () => {
        const schema = toChromeSchema({ state: {}, questions: { q: { type: 'noul', instructions: 'x' } }, languages: ['en'] })
        expect(typeof schema.context).toBe('string')
        expect(schema.expectedInputs[0].languages).toEqual(['en'])
    })

    it('畸形输入 fail-open：空问题/未知类型/缺 instructions/criteria 形态不符 → null', () => {
        expect(toChromeSchema({ state: {}, questions: {} })).toBeNull()
        expect(toChromeSchema({ state: {}, questions: { q: { type: 'mystery', instructions: 'x' } } })).toBeNull()
        expect(toChromeSchema({ state: {}, questions: { q: { type: 'noul' } } })).toBeNull()
        expect(toChromeSchema({ state: {}, questions: { q: { type: 'choice', instructions: 'x' } } })).toBeNull() // choice 缺 criteria 对象
        expect(toChromeSchema({
            state: {}, questions: {
                ok: { type: 'noul', instructions: 'x' },
                bad: { type: 'score', instructions: 'x', criteria: 'not-array' }
            }
        })).toBeNull() // 混入一个不合法即整体拒绝
    })
})

describe('fromChromeResult（端侧响应 → askDecisions 归一形态）', () => {
    it('boolean 取 probabilities.true，choice 校验 criteria 越界，score 取 expectedScore', () => {
        const out = fromChromeResult({
            need_explain: { id: 'need_explain', label: 'true', confidence: 0.8, probabilities: { true: 0.8, false: 0.2 } },
            error_cause: { id: 'error_cause', label: 'careless', probabilities: { careless: 0.7, concept_confusion: 0.3 } },
            urgency: { id: 'urgency', label: '3', expectedScore: 2.6, probabilities: { '1': 0.1, '2': 0.3, '3': 0.6 } }
        }, SYSTEM_ONE_QUESTIONS)
        expect(out).toEqual({
            need_explain: { value: 0.8 },
            error_cause: { value: 'careless', probabilities: { careless: 0.7, concept_confusion: 0.3 } },
            urgency: { value: 2.6 }
        })
    })

    it('probabilities 缺失时按 label 0/1 折算；越界/类型不符丢弃；全无效 → null', () => {
        const out = fromChromeResult({
            need_explain: { label: 'false' },                                     // 无 probabilities → 0
            error_cause: { label: 'made_up' },                                    // 不在 criteria → 丢
            urgency: { label: 'not-a-number' }                                    // expectedScore 缺且 label 非数 → 丢
        }, SYSTEM_ONE_QUESTIONS)
        expect(out).toEqual({ need_explain: { value: 0 } })
        expect(fromChromeResult({ need_explain: { label: 'maybe' } }, SYSTEM_ONE_QUESTIONS)).toBeNull()
        expect(fromChromeResult(null, SYSTEM_ONE_QUESTIONS)).toBeNull()
    })
})

// window.DecisionModel 桩：availability/create + session.decide/destroy
// 真实 API 是 function（构造器接口）而非普通对象 —— 模块按 typeof==='function' 探测，桩必须同形；
// happy-dom 下 window 与 globalThis 非同一对象：vi.stubGlobal 只落 globalThis，双写兜住
const stubDecisionModel = ({ availability = 'available', decideImpl } = {}) => {
    const session = {
        preference: 'auto',
        decide: vi.fn(decideImpl || (async () => ({}) )),
        destroy: vi.fn()
    }
    const DM = function DecisionModel() {}
    DM.availability = vi.fn(async () => availability)
    DM.create = vi.fn(async () => session)
    vi.stubGlobal('DecisionModel', DM)
    window.DecisionModel = DM
    return { DM, session }
}

const clearDecisionModel = () => {
    vi.stubGlobal('DecisionModel', undefined)
    try { delete window.DecisionModel } catch { window.DecisionModel = undefined }
}

describe('askDecisionsChrome（休眠端侧通道 fail-open）', () => {
    it('浏览器无 DecisionModel / 非 available → 直接 null 且不 create', async () => {
        clearDecisionModel()
        expect(await askDecisionsChrome({ state: {}, questions: { q: { type: 'noul', instructions: 'x' } } })).toBeNull()

        const { DM } = stubDecisionModel({ availability: 'unavailable' }) // 157 现状：zh 硬拦
        expect(await askDecisionsChrome({ state: {}, questions: { q: { type: 'noul', instructions: 'x' } } })).toBeNull()
        expect(DM.create).not.toHaveBeenCalled() // downloadable/unavailable 不自动下载、零副作用

        const { DM: DM2 } = stubDecisionModel({ availability: 'downloadable' })
        expect(await askDecisionsChrome({ state: {}, questions: { q: { type: 'noul', instructions: 'x' } } })).toBeNull()
        expect(DM2.create).not.toHaveBeenCalled()
    })

    it('成功路径：create(schema) → decide(JSON.stringify(state)) → destroy 必调 → 归一输出', async () => {
        const { DM, session } = stubDecisionModel({
            decideImpl: async () => ({
                need_explain: { label: 'true', probabilities: { true: 0.66, false: 0.34 } },
                error_cause: { label: 'concept_confusion', probabilities: { concept_confusion: 0.66, careless: 0.34 } }
            })
        })
        const state = { scenario: 's', stem: '题干' }
        const out = await askDecisionsChrome({ state, questions: SYSTEM_ONE_QUESTIONS, languages: ['en'] })
        expect(DM.create).toHaveBeenCalledTimes(1)
        const schema = DM.create.mock.calls[0][0]
        expect(schema.expectedInputs[0].languages).toEqual(['en'])
        expect(session.decide).toHaveBeenCalledWith(JSON.stringify(state)) // state 显式序列化，不赌隐式行为
        expect(out.need_explain).toEqual({ value: 0.66 })
        expect(out.error_cause.value).toBe('concept_confusion')
        expect(session.destroy).toHaveBeenCalled()
    })

    it('decide 异常 / 超时 / 响应全无效 → null，destroy 仍被调用且不 reject', async () => {
        const { session: s1 } = stubDecisionModel({ decideImpl: async () => { throw new DOMException('engine error') } })
        expect(await askDecisionsChrome({ state: {}, questions: SYSTEM_ONE_QUESTIONS })).toBeNull()
        expect(s1.destroy).toHaveBeenCalled()

        const { session: s2 } = stubDecisionModel({ decideImpl: () => new Promise(() => {}) }) // 永不 resolve
        expect(await askDecisionsChrome({ state: {}, questions: SYSTEM_ONE_QUESTIONS, timeoutMs: 20 })).toBeNull()
        expect(s2.destroy).toHaveBeenCalled()

        const { session: s3 } = stubDecisionModel({ decideImpl: async () => ({ need_explain: { label: 'maybe' } }) })
        expect(await askDecisionsChrome({ state: {}, questions: SYSTEM_ONE_QUESTIONS })).toBeNull()
        expect(s3.destroy).toHaveBeenCalled()
    })

    it('create 抛错（如 zh NotSupportedError）→ null 不炸', async () => {
        const DM = function DecisionModel() {}
        DM.availability = vi.fn(async () => 'available')
        DM.create = vi.fn(async () => { throw new DOMException('The requested language options are not supported.', 'NotSupportedError') })
        vi.stubGlobal('DecisionModel', DM)
        window.DecisionModel = DM
        expect(await askDecisionsChrome({ state: {}, questions: { q: { type: 'noul', instructions: 'x' } } })).toBeNull()
    })
})

describe('probeChromeDecisions（关于页状态卡探测）', () => {
    it('无 API → { api:false }；正常 → 透传 availability；异常 → error 带消息', async () => {
        clearDecisionModel()
        expect(await probeChromeDecisions({ languages: ['zh'] })).toEqual({ api: false })

        const { DM } = stubDecisionModel({ availability: 'downloadable' })
        expect(await probeChromeDecisions({ languages: ['zh'] })).toEqual({ api: true, availability: 'downloadable' })
        expect(DM.availability).toHaveBeenCalledTimes(1)

        const throwingDM = function DecisionModel() {}
        throwingDM.availability = vi.fn(async () => { throw new Error('boom') })
        vi.stubGlobal('DecisionModel', throwingDM)
        window.DecisionModel = throwingDM
        const r = await probeChromeDecisions({})
        expect(r.api).toBe(true)
        expect(r.availability).toBe('error')
        expect(r.error).toContain('boom')
    })
})
