/**
 * 错因洞察 · Cloudflare Clef 通道（同域免密钥）。
 *
 * 页面 POST /api/decisions { state, questions }（System One 三原语 noul/choice/score），
 * 本函数固定 model 后经 env.AI 调 Workers AI clef-flash，原样返回 { model, answers, usage }。
 * 浏览器零密钥、零 CORS；费用按神经元记在站点账号（实测单次 ≈1.2 neuron，免费额度 ≈8400 次/天）。
 *
 * 防护（无鉴权公开端点，抬高滥用成本）：
 *   - body 上限 8KB（正常单题 payload 1–2KB），超限 413
 *   - 问题数 ≤ 8，id / type / instructions 逐项校验，畸形输入 400
 *   - model 字段忽略客户端值，服务端固定 —— 客户端指定不了高价模型
 *
 * 未绑定 Workers AI → 503；模型调用异常 → 502。页面侧 askDecisions fail-open，
 * 以上任何状态都只是「无洞察」，不影响答题主链路。
 */

const MODEL_ID = '@cf/cloudflare/clef-flash' // Workers AI 全名，仅服务端可知
const MODEL_SELECTOR = 'clef-flash' // body 内短选择器（models/schema 契约）
const MAX_BODY_CHARS = 8 * 1024
const MAX_QUESTIONS = 8
const QUESTION_TYPES = new Set(['noul', 'choice', 'score'])

const json = (data, status = 200) => new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
})

/** 结构校验：返回错误消息或 null。不做语义校验（criteria 形态交给模型侧报错兜底） */
function validate(body) {
    if (!body || typeof body !== 'object') return 'invalid body'
    if (body.state === undefined) return 'state required'
    const { questions } = body
    if (!questions || typeof questions !== 'object' || Array.isArray(questions)) return 'questions map required'
    const ids = Object.keys(questions)
    if (ids.length < 1 || ids.length > MAX_QUESTIONS) return 'question count out of range'
    for (const id of ids) {
        if (!/^[A-Za-z0-9_.-]{1,100}$/.test(id)) return 'bad question id'
        const q = questions[id]
        if (!q || typeof q !== 'object' || !QUESTION_TYPES.has(q.type)) return 'bad question type'
        if (typeof q.instructions !== 'string' || !q.instructions.trim()) return 'instructions required'
    }
    return null
}

export async function onRequestPost({ request, env }) {
    if (!env.AI) return json({ error: 'Workers AI binding missing' }, 503)
    const raw = await request.text()
    if (raw.length > MAX_BODY_CHARS) return json({ error: 'payload too large' }, 413)
    let body
    try {
        body = JSON.parse(raw)
    } catch {
        return json({ error: 'invalid json' }, 400)
    }
    const err = validate(body)
    if (err) return json({ error: err }, 400)
    try {
        const result = await env.AI.run(MODEL_ID, {
            model: MODEL_SELECTOR,
            state: body.state,
            questions: body.questions
        })
        return json(result)
    } catch {
        return json({ error: 'model call failed' }, 502)
    }
}

export async function onRequest() {
    return json({ error: 'method not allowed' }, 405)
}
