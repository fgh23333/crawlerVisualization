/**
 * 全站错题频率采集 · 匿名计数端点（D1）。
 *
 * POST /api/wrongstats { v:1, batchId, uuid, items:[{qid,s,a,e}] }
 *   客户端批次去重累加进 question_stats 聚合表；sync_ledger 以 batch_id 为主键
 *   先行落台账 —— 重放批次（changes===0）直接确认 duplicate，永不重复计数。
 * GET  /api/wrongstats?subject=&limit=&min_attempts=
 *   按累计错误数降序输出聚合（站长与统计页共用），caches.default 边缘缓存。
 *
 * 只存题目 ID 与计数：无题目文本、无账号、无 IP。uuid 仅用于限流台账关联，
 * 取自客户端 crypto.randomUUID，不可当身份凭证。
 *
 * 防护（无鉴权公开端点）：
 *   - body 上限 16KB（单批 200 题的合法 payload ~10KB），超限 413
 *   - v/batchId/uuid/items 逐项严格校验，畸形输入 400
 *   - 每 uuid 每小时 ≤ 12 批（台账行数限流），超限 429
 *
 * 未绑定 D1 → 503；DB 异常 → 500。客户端 flushWrongStats 全程静默容错，
 * 以上任何状态都只影响「全站高频错题」展示，不影响答题。
 */

const MAX_BODY_CHARS = 16 * 1024
const MAX_ITEMS = 200
const RATE_WINDOW_MS = 60 * 60 * 1000
const RATE_MAX_BATCHES = 12
const SUBJECTS = new Set(['Marx', 'CMH', 'Political', 'MaoIntro', 'XiIntro', 'SDH', 'NCH', 'CCPH', 'ORH'])

const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers }
})

/** 结构校验：返回错误消息或 null */
function validatePost(body) {
    if (!body || typeof body !== 'object') return 'invalid body'
    if (body.v !== 1) return 'unsupported version'
    if (typeof body.uuid !== 'string' || !/^[A-Za-z0-9-]{8,64}$/.test(body.uuid)) return 'bad uuid'
    if (typeof body.batchId !== 'string' || !/^[A-Za-z0-9-]{10,80}$/.test(body.batchId)) return 'bad batchId'
    if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > MAX_ITEMS) return 'items count out of range'
    for (const item of body.items) {
        if (!item || typeof item !== 'object') return 'bad item'
        if (typeof item.qid !== 'string' || !/^[A-Za-z0-9_-]{1,32}$/.test(item.qid)) return 'bad qid'
        if (!SUBJECTS.has(item.s)) return 'bad subject'
        if (!Number.isInteger(item.a) || item.a < 1 || item.a > 20) return 'bad attempts'
        if (!Number.isInteger(item.e) || item.e < 0 || item.e > item.a) return 'bad errors'
    }
    return null
}

export async function onRequestPost({ request, env }) {
    if (!env.DB) return json({ error: 'D1 binding missing' }, 503)
    const raw = await request.text()
    if (raw.length > MAX_BODY_CHARS) return json({ error: 'payload too large' }, 413)
    let body
    try {
        body = JSON.parse(raw)
    } catch {
        return json({ error: 'invalid json' }, 400)
    }
    const err = validatePost(body)
    if (err) return json({ error: err }, 400)

    try {
        // 限流：台账行数近似本小时批次量（台账先行落库，窗口滑动的误差可忽略）
        const rate = await env.DB.prepare(
            'SELECT COUNT(*) AS n FROM sync_ledger WHERE client_uuid = ?1 AND created_at > ?2'
        ).bind(body.uuid, Date.now() - RATE_WINDOW_MS).first()
        if (rate && rate.n >= RATE_MAX_BATCHES) {
            return json({ error: 'rate limited', retryAfterSec: 3600 }, 429)
        }

        // 幂等台账先行：batch_id 撞主键说明是重放批次，直接确认、不重复累加
        const ledger = await env.DB.prepare(
            'INSERT INTO sync_ledger (batch_id, client_uuid, item_count, created_at) VALUES (?1, ?2, ?3, ?4) ON CONFLICT(batch_id) DO NOTHING'
        ).bind(body.batchId, body.uuid, body.items.length, Date.now()).run()
        if (ledger.meta.changes === 0) {
            return json({ ok: true, duplicate: true })
        }

        // 聚合累加：每题一行 upsert（台账先行的崩溃窗口最多丢一批增量，遥测可接受）
        const now = Date.now()
        const statements = body.items.map(item =>
            env.DB.prepare(
                `INSERT INTO question_stats (question_id, subject, attempts_sum, errors_sum, last_seen)
                 VALUES (?1, ?2, ?3, ?4, ?5)
                 ON CONFLICT(question_id) DO UPDATE SET
                   attempts_sum = attempts_sum + excluded.attempts_sum,
                   errors_sum = errors_sum + excluded.errors_sum,
                   last_seen = excluded.last_seen`
            ).bind(item.qid, item.s, item.a, item.e, now)
        )
        await env.DB.batch(statements)
        return json({ ok: true, accepted: body.items.length })
    } catch {
        return json({ error: 'db error' }, 500)
    }
}

export async function onRequestGet({ request, env }) {
    if (!env.DB) return json({ error: 'D1 binding missing' }, 503)
    const url = new URL(request.url)
    const subject = url.searchParams.get('subject') || ''
    if (subject && !SUBJECTS.has(subject)) return json({ error: 'bad subject' }, 400)
    const limit = Math.min(Math.max(Math.trunc(Number(url.searchParams.get('limit')) || 20), 1), 200)
    const minAttempts = Math.max(Math.trunc(Number(url.searchParams.get('min_attempts')) || 10), 1)

    // 边缘缓存 2 分钟：计数聚合分钟级新鲜度足够，同参请求不打 D1
    const cache = (typeof caches !== 'undefined' && caches.default) || null
    if (cache) {
        const hit = await cache.match(request)
        if (hit) return hit
    }

    try {
        // subject 与否占位符编号不同，各建一条 SQL（D1 要求绑定数与占位符严格一致）
        const stmt = subject
            ? env.DB.prepare(
                'SELECT question_id, subject, attempts_sum, errors_sum FROM question_stats WHERE subject = ?1 AND attempts_sum >= ?2 ORDER BY errors_sum DESC, attempts_sum DESC LIMIT ?3'
            ).bind(subject, minAttempts, limit)
            : env.DB.prepare(
                'SELECT question_id, subject, attempts_sum, errors_sum FROM question_stats WHERE attempts_sum >= ?1 ORDER BY errors_sum DESC, attempts_sum DESC LIMIT ?2'
            ).bind(minAttempts, limit)
        const { results } = await stmt.all()
        const items = (results || []).map(row => ({
            qid: row.question_id,
            subject: row.subject,
            attempts: row.attempts_sum,
            errors: row.errors_sum,
            rate: row.attempts_sum > 0 ? Math.round((row.errors_sum / row.attempts_sum) * 1000) / 1000 : 0
        }))
        const response = json({ v: 1, updatedAt: Date.now(), items }, 200, {
            'Cache-Control': 'public, max-age=120, s-maxage=300'
        })
        if (cache) cache.put(request, response.clone()).catch(() => {})
        return response
    } catch {
        return json({ error: 'db error' }, 500)
    }
}

export async function onRequest() {
    return json({ error: 'method not allowed' }, 405)
}
