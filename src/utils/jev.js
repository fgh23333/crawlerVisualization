/**
 * 决策模型（System One 形态）客户端 —— 方案 B 语义层第一步。
 *
 * 双通道（2026-10-26 拍板，clef 为主推）：
 *   - clef（默认）：同域 Pages Function /api/decisions → Workers AI clef-flash，
 *     浏览器零密钥零 CORS；Clef 与 Jev 同契约（官方 changelog："drop-in compatible with Jev"）。
 *   - openrouter（BYOK）：直连 openrouter.ai/api/alpha/decisions 调 Jev，key 存本机 localStorage。
 *
 * 契约（OpenRouter 官方 OpenAPI + Workers AI models/schema 一手核实，2026-10-26，两端同构）：
 *   POST {endpoint}
 *   { model, state, questions, session_id?(仅 openrouter) }
 *     questions: { [id]: { type:'noul'|'choice'|'score', instructions, criteria? } }
 *       - noul 的 criteria 可选（true/false 描述）；choice 的 criteria 为对象；score 的 criteria 为有序数组
 *   → { answers: { [id]: { type, noul | choice | score, confidence?, probabilities? } }, model, usage }
 *   端间差异仅三处：clef 的 model 取短选择器 'clef-flash'（全名由服务端函数固定）、
 *   body 无 session_id、choice/score 的 probabilities/confidence 必返 —— normalizeAnswer 直接兼容。
 *
 * 红线（见 jev 调研结论，全条落实）：
 *   - key 只走 BYOK（clef 通道则完全无 key）：配置存 localStorage，绝不打进构建产物（无 VITE_ 前缀）
 *   - fail-open：任何失败/超时/校验不过 → resolve null，调用方回退现有逻辑；
 *     消费端异步取用，永不 await 阻塞答题主链路
 *   - 默认启用 clef 免密钥通道（2026-10-26 拍板：同域 Function 无泄露面，「关于」页不再放开关）；
 *     显式写过 enabled:false 的老配置仍被尊重
 *   - 只上送单题：state 仅含当前题目与本次作答，不带 userRecords/画像等全量 profile
 *
 * 端侧通道（Chrome 157+ Decisions API，2026-11-04 本机实证；休眠、未接主链路）：
 *   window.DecisionModel 与本契约同构：boolean↔noul / choice↔choice / score↔score，
 *   一次 decide() 按问题 id 并行返回 label+confidence+probabilities。
 *   实测三硬伤：①languages:['zh'] 被 availability/create 硬拦（NotSupportedError，en/ja 已就绪）
 *   ②弱机 create ~7s + decide ~32s；③中文判例质量未达基线 → 不进 askDecisions 主链路。
 *   本文件只提供探测（probeChromeDecisions）+ 适配层（toChromeSchema/fromChromeResult/
 *   askDecisionsChrome），中文覆盖落地当天把通道并入 askDecisions 即用（免费不限量/离线/零上送）。
 *   157 实测校验要点：boolean 问题不得带 options（TypeError）；choice 必须带 options；
 *   state 对象需自行 JSON.stringify 成文本输入；preference 为 getter（'auto'），引擎不可枚举。
 */

export const CLEF_PROVIDER = 'clef'
export const OPENROUTER_PROVIDER = 'openrouter'
// 端侧通道（休眠）：Chrome 157+ window.DecisionModel，中文覆盖落地后并入 askDecisions
export const CHROME_PROVIDER = 'chrome'

export const JEV_MODEL = 'typesafe/jev-1.13'
export const JEV_DEFAULT_ENDPOINT = 'https://openrouter.ai/api/alpha/decisions'
// clef 通道：body 内是短选择器（Workers AI 契约），全名 @cf/cloudflare/clef-flash 由函数服务端固定，
// 客户端无法指定其他（高价）模型
export const CLEF_MODEL = 'clef-flash'
export const CLEF_ENDPOINT = '/api/decisions'
// fail-open 上限：超时/报错/校验不过一律返回 null。消费端展示层异步等结果，
// 答题主链路（判分/收录/记录）从不 await 本模块 —— 回退语义即「无洞察」。
// clef-flash 官方中位 38.8ms / p95 122ms（2026-10-01 changelog），同域通道 5000ms 上限只兜极端网络。
export const JEV_TIMEOUT_MS = 5000

const CONFIG_KEY = 'jev_config'

const isClefProvider = (provider) => provider === CLEF_PROVIDER

const defaultEndpointOf = (provider) => (isClefProvider(provider) ? CLEF_ENDPOINT : JEV_DEFAULT_ENDPOINT)

/**
 * 读配置（损坏 JSON 容错为空配置；localStorage 不可用同样返回空配置）。
 * 旧配置迁移：无 provider 字段时有 apiKey 视为 openrouter（v1 唯一通道），否则落 clef 默认。
 * enabled 默认 true（无配置/未显式写过即为开启）；仅显式 enabled:false 视为用户关闭。
 */
export function getJevConfig() {
    const empty = { enabled: true, provider: CLEF_PROVIDER, apiKey: '', endpoint: CLEF_ENDPOINT }
    try {
        const raw = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}')
        const provider = raw.provider === OPENROUTER_PROVIDER || raw.provider === CLEF_PROVIDER
            ? raw.provider
            : (typeof raw.apiKey === 'string' && raw.apiKey ? OPENROUTER_PROVIDER : CLEF_PROVIDER)
        return {
            enabled: raw.enabled !== false,
            provider,
            apiKey: typeof raw.apiKey === 'string' ? raw.apiKey : '',
            endpoint: typeof raw.endpoint === 'string' && raw.endpoint ? raw.endpoint : defaultEndpointOf(provider)
        }
    } catch {
        return empty
    }
}

/** 局部更新配置；openrouter 通道 key 置空视为关闭（clef 通道同域免密钥，无此约束） */
export function setJevConfig(patch = {}) {
    const cur = getJevConfig()
    const next = { ...cur, ...patch }
    // 通道切换时端点跟着换默认值（除非本次 patch 同时显式给出端点）——端点属于通道
    if (patch.provider && patch.provider !== cur.provider && patch.endpoint === undefined) {
        next.endpoint = defaultEndpointOf(next.provider)
    }
    if (!isClefProvider(next.provider) && !next.apiKey) next.enabled = false
    try {
        localStorage.setItem(CONFIG_KEY, JSON.stringify(next))
    } catch { /* 配额满等写入失败静默忽略，读取侧自然回落旧值 */ }
    return next
}

/** 总开关：clef 通道默认即启用（免密钥）；openrouter 通道另需 key */
export function isJevEnabled() {
    const c = getJevConfig()
    return c.enabled && (isClefProvider(c.provider) || !!c.apiKey)
}

/**
 * 组装官方契约请求体（扁平，非 SDK 的 decisionsRequest 包装）。
 * @param {object} arg
 * @param {object|string} arg.state 共享证据：任意 JSON（本站仅单题字段）
 * @param {Record<string, object>} arg.questions 问题 map：id → { type, instructions, criteria? }
 * @param {string} [arg.provider] 通道；clef 的 body 不带 session_id（其契约无此字段）
 */
export function buildDecisionsPayload({ state, questions, sessionId, provider = CLEF_PROVIDER } = {}) {
    const payload = { model: isClefProvider(provider) ? CLEF_MODEL : JEV_MODEL, state, questions }
    if (!isClefProvider(provider) && sessionId) payload.session_id = String(sessionId)
    return payload
}

/** 归一化单个 answer：按请求侧问题定义校验，不合法返回 undefined（fail-open 单题粒度） */
function normalizeAnswer(answer, question) {
    if (!answer || typeof answer !== 'object') return undefined
    if (question.type === 'noul') {
        if (answer.type !== 'noul' || typeof answer.noul !== 'number' || !Number.isFinite(answer.noul)) return undefined
        return { value: answer.noul }
    }
    if (question.type === 'choice') {
        // choice 必须落在 criteria 定义的选项内，模型越界输出直接判无效
        if (answer.type !== 'choice' || typeof answer.choice !== 'string') return undefined
        if (!question.criteria || !(answer.choice in question.criteria)) return undefined
        return { value: answer.choice, probabilities: answer.probabilities || undefined }
    }
    if (question.type === 'score') {
        if (answer.type !== 'score' || typeof answer.score !== 'number' || !Number.isFinite(answer.score)) return undefined
        return { value: answer.score }
    }
    return undefined
}

/**
 * 发起一次 Decisions 调用（一次请求并行多问）。
 * @returns {Promise<Record<string, {value:number|string, probabilities?:object}> | null>}
 *   成功 → { [问题id]: { value, probabilities? } }（仅含校验通过的项）；
 *   关闭 / openrouter 无 key / 网络/超时/非 2xx / 响应不合法 → null（永不 reject）
 */
export async function askDecisions({ state, questions, sessionId, timeoutMs = JEV_TIMEOUT_MS } = {}) {
    const config = getJevConfig()
    if (!config.enabled) return null
    const clef = isClefProvider(config.provider)
    if (!clef && !config.apiKey) return null

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
        // clef 同域通道免密钥；openrouter BYOK 带 Authorization + 归因标识
        const headers = { 'Content-Type': 'application/json' }
        if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`
        if (!clef) headers['X-Title'] = 'shou-political-bank'
        const resp = await fetch(config.endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(buildDecisionsPayload({ state, questions, sessionId, provider: config.provider })),
            signal: controller.signal
        })
        if (!resp.ok) return null
        const data = await resp.json()
        if (!data || typeof data !== 'object' || !data.answers || typeof data.answers !== 'object') return null

        const out = {}
        for (const id of Object.keys(questions)) {
            const norm = normalizeAnswer(data.answers[id], questions[id])
            if (norm) out[id] = norm
        }
        return Object.keys(out).length > 0 ? out : null
    } catch {
        // 超时（AbortError）/ 网络错误 / JSON 解析失败 —— 全部 fail-open
        return null
    } finally {
        clearTimeout(timer)
    }
}

/** 错因四分类（方案 B 决策槽一）：key 稳定，展示文案由消费端映射 */
export const ERROR_CAUSE_LABELS = {
    concept_confusion: '概念混淆',
    trap_misread: '审题陷阱',
    careless: '粗心失误',
    memory_fade: '记忆衰退'
}

/**
 * 方案 B 决策槽一 + 二：练习答错后，一次请求并行问「错因归因 + 是否需要讲解」。
 * state 严格只含当前题目与本次作答（红线：不带全量画像）。
 * @returns {{ state: object, questions: Record<string, object> }}
 */
export function buildWrongAnswerAnalysis({ question, userAnswer, timeSpentMs } = {}) {
    const state = {
        scenario: '中国大学思政课/计算机等级考试题库练习',
        subject: question.abbreviationSubject || '',
        questionType: question.typeLabel || '',
        stem: question.questionStem,
        options: Array.isArray(question.option) ? question.option : [],
        correctAnswer: question.answer,
        userAnswer: userAnswer == null ? '' : String(userAnswer),
        secondsSpent: timeSpentMs != null ? Math.max(1, Math.round(timeSpentMs / 1000)) : null
    }
    const questions = {
        error_cause: {
            type: 'choice',
            instructions: '考生在这道题的练习中答错了。结合题面、正确答案与考生作答，判断最主要的一类错因。',
            criteria: {
                concept_confusion: '混淆了相近的概念、原理或表述，属于知识性错误',
                trap_misread: '题干含反向提问/限定词/干扰项等陷阱，考生审题不仔细而答错',
                careless: '知识本身掌握，但漏选、误选或笔误，属于粗心',
                memory_fade: '对考点印象模糊，凭残存记忆猜测作答'
            }
        },
        need_explain: {
            type: 'noul',
            instructions: '这位考生是否需要查看这道题的详细讲解（而非只对答案）？',
            criteria: {
                true: '错因属于知识性缺口或记忆模糊，看讲解收益大',
                false: '粗心或审题问题，重读题面即可纠正'
            }
        }
    }
    return { state, questions }
}

// ═══════════════════════════════════════════════════════════════
// 端侧通道（Chrome 157+ Decisions API）——休眠适配层，未接 askDecisions 主链路。
// 契约映射（2026-11-04 Chrome 157 本机实证）：
//   System One                              Chrome Decisions
//   noul   {instructions, criteria?}   →   boolean {prompt}（禁带 options）
//   choice {instructions, criteria对象} →   choice {prompt, options:[{label,description}]}
//   score  {instructions, criteria数组} →   score  {prompt, options:[{label:'1'..,description}]}
//   state  对象                         →   decide(JSON.stringify(state))
//   answers[id].noul/.choice/.score     ←   result[id].label/.probabilities/.expectedScore
// ═══════════════════════════════════════════════════════════════

const getDecisionModel = () =>
    (typeof window !== 'undefined' && typeof window.DecisionModel === 'function') ? window.DecisionModel : null

/** System One 问题 → Chrome 问题；不合法（缺 instructions / 类型未知 / criteria 形态不符）返回 null */
function toChromeQuestion(id, q) {
    if (!q || typeof q !== 'object' || typeof q.instructions !== 'string' || !q.instructions.trim()) return null
    const prompt = q.instructions
    if (q.type === 'noul') {
        // 157 实测：boolean 问题带 options 直接 TypeError
        return { id, type: 'boolean', prompt }
    }
    if (q.type === 'choice') {
        const criteria = q.criteria && typeof q.criteria === 'object' && !Array.isArray(q.criteria) ? q.criteria : null
        if (!criteria) return null
        return {
            id, type: 'choice', prompt,
            options: Object.keys(criteria).map(label => ({ label, description: String(criteria[label]) }))
        }
    }
    if (q.type === 'score') {
        if (!Array.isArray(q.criteria) || q.criteria.length === 0) return null
        return {
            id, type: 'score', prompt,
            options: q.criteria.map((desc, i) => ({ label: String(i + 1), description: String(desc) }))
        }
    }
    return null
}

/**
 * 组装 Chrome Decisions schema（System One 形态 → 端侧形态）。
 * @param {object} arg.state 同 askDecisions 的 state（scenario 字段优先进 context）
 * @param {Record<string, object>} arg.questions System One 问题 map
 * @param {string[]} [arg.languages] 声明输入语言，默认 ['zh']（当前 157 引擎不支持 zh，
 *   availability 会返回 unavailable —— 这正是休眠不开的原因，中文覆盖后自动变绿）
 * @returns {object|null} 任一问题不合法即 null（fail-open）
 */
export function toChromeSchema({ state, questions, languages = ['zh'] } = {}) {
    if (!questions || typeof questions !== 'object') return null
    const ids = Object.keys(questions)
    if (ids.length === 0) return null
    const chromeQuestions = ids.map(id => toChromeQuestion(id, questions[id]))
    if (chromeQuestions.some(q => !q)) return null
    const context = (state && typeof state.scenario === 'string' && state.scenario)
        || 'Structured decision making for a quiz practice app'
    return {
        context,
        expectedInputs: [{ type: 'text', languages }],
        questions: chromeQuestions
    }
}

/**
 * Chrome decide 结果 → askDecisions 同款归一形态 { [id]: { value, probabilities? } }。
 * 单题粒度校验：boolean 取 probabilities.true（缺失按 label 01 折算）、choice 必须落在
 * criteria 选项内、score 取 expectedScore；不合法项丢弃，全部无效返回 null。
 */
export function fromChromeResult(result, questions) {
    if (!result || typeof result !== 'object' || !questions) return null
    const out = {}
    for (const id of Object.keys(questions)) {
        const a = result[id]
        const q = questions[id]
        if (!a || typeof a !== 'object') continue
        if (q.type === 'noul') {
            const p = a.probabilities && typeof a.probabilities.true === 'number'
                ? a.probabilities.true
                : (a.label === 'true' ? 1 : a.label === 'false' ? 0 : NaN)
            if (Number.isFinite(p)) out[id] = { value: p }
        } else if (q.type === 'choice') {
            if (typeof a.label !== 'string') continue
            if (!q.criteria || !(a.label in q.criteria)) continue
            out[id] = { value: a.label, probabilities: a.probabilities || undefined }
        } else if (q.type === 'score') {
            const v = typeof a.expectedScore === 'number' ? a.expectedScore : Number(a.label)
            if (Number.isFinite(v)) out[id] = { value: v }
        }
    }
    return Object.keys(out).length > 0 ? out : null
}

/**
 * 探测端侧决策引擎状态（关于页状态卡用；availability 是轻量查询，不触发下载）。
 * @returns {Promise<{api:boolean, availability?:string, error?:string}>}
 *   api:false = 浏览器无 DecisionModel（非 Chrome 157+）；availability ∈ available/downloadable/unavailable
 */
export async function probeChromeDecisions({ languages = ['zh'] } = {}) {
    const DM = getDecisionModel()
    if (!DM) return { api: false }
    const schema = {
        context: 'On-device decision engine capability probe',
        expectedInputs: [{ type: 'text', languages }],
        questions: [{ id: 'probe', type: 'boolean', prompt: 'Does this text describe a software bug?' }]
    }
    try {
        return { api: true, availability: await DM.availability(schema) }
    } catch (e) {
        return { api: true, availability: 'error', error: String((e && e.message) || e) }
    }
}

/**
 * 端侧 Decisions 调用（休眠通道，语义与 askDecisions 对齐：永不 reject，失败返回 null）。
 * 仅 availability === 'available' 时继续（downloadable 不自动触发模型下载——休眠通道零副作用）。
 * 注意：157 中文被引擎硬拦，本函数现阶段只在 en 声明下可用；默认 5s 超时对齐 fail-open 红线，
 * 弱机实测 decide ~32s 会超时回退 —— 主链路并入时再按硬件分布调参。
 */
export async function askDecisionsChrome({ state, questions, languages = ['zh'], timeoutMs = JEV_TIMEOUT_MS } = {}) {
    const DM = getDecisionModel()
    if (!DM) return null
    const schema = toChromeSchema({ state, questions, languages })
    if (!schema) return null
    let session = null
    let timer = null
    try {
        if (await DM.availability(schema) !== 'available') return null
        session = await DM.create(schema)
        const input = typeof state === 'string' ? state : JSON.stringify(state)
        const result = await Promise.race([
            session.decide(input),
            new Promise((_resolve, reject) => {
                timer = setTimeout(() => reject(new Error('timeout')), timeoutMs)
            })
        ])
        return fromChromeResult(result, questions)
    } catch {
        return null // API 缺失/语言不支持/超时/异常 —— 全部 fail-open
    } finally {
        clearTimeout(timer)
        try { session && session.destroy && session.destroy() } catch { /* destroy 失败静默 */ }
    }
}
