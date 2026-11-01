import { describe, it, expect, vi } from 'vitest'
import { onRequestPost, onRequestGet, onRequest } from '../functions/api/wrongstats'

// Pages Function（匿名错题频率采集）：D1 binding 桩注入，Request/Response 走 Node 全局。
// 契约：POST /api/wrongstats { v:1, batchId, uuid, items } → { ok, accepted | duplicate }
//       GET  /api/wrongstats?subject=&limit=&min_attempts= → { v, updatedAt, items }
// 幂等核心：sync_ledger 以 batch_id 为主键，重放批次不重复累加聚合表。

const VALID_BODY = {
    v: 1,
    batchId: 'client-uuid-0001',
    uuid: 'client-uuid',
    items: [
        { qid: '1798736702152376321', s: 'Marx', a: 3, e: 2 },
        { qid: 'q2', s: 'CMH', a: 1, e: 0 }
    ]
}

/** D1 桩：按 SQL 分派返回值，记录调用轨迹 */
function makeDb({
    rateN = 0,
    ledgerChanges = 1,
    getResults = [],
    failAt = null
} = {}) {
    const calls = { sqls: [], batches: [], binds: [] }
    const db = {
        batch: vi.fn(async (stmts) => { calls.batches.push(stmts) }),
        prepare(sql) {
            calls.sqls.push(sql)
            const stmt = {
                bind: (...args) => { stmt._bound = args; calls.binds.push(args); return stmt },
                first: async () => { if (failAt === 'rate') throw new Error('db down'); return { n: rateN } },
                run: async () => { if (failAt === 'ledger') throw new Error('db down'); return { meta: { changes: ledgerChanges } } },
                all: async () => { if (failAt === 'get') throw new Error('db down'); return { results: getResults } }
            }
            return stmt
        }
    }
    return { db, calls }
}

const post = (env, body, { raw } = {}) =>
    onRequestPost({
        request: new Request('https://site.example/api/wrongstats', {
            method: 'POST',
            body: raw ?? JSON.stringify(body)
        }),
        env
    })

const get = (env, query = '') =>
    onRequestGet({ request: new Request('https://site.example/api/wrongstats' + query), env })

describe('functions/api/wrongstats POST（采集上送）', () => {
    it('正常批次：台账先行 + 聚合 upsert，返回 accepted', async () => {
        const { db, calls } = makeDb()
        const res = await post({ DB: db }, VALID_BODY)
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data).toEqual({ ok: true, accepted: 2 })
        // 台账先于聚合表写入
        expect(calls.sqls[0]).toContain('sync_ledger')
        expect(calls.sqls[1]).toContain('INSERT INTO sync_ledger')
        expect(calls.batches).toHaveLength(1)
        expect(calls.batches[0]).toHaveLength(2)
        expect(calls.sqls[2]).toContain('ON CONFLICT(question_id)')
    })

    it('重放同 batchId → duplicate:true 且不碰聚合表（幂等，永不重复计数）', async () => {
        const { db, calls } = makeDb({ ledgerChanges: 0 })
        const res = await post({ DB: db }, VALID_BODY)
        expect(res.status).toBe(200)
        expect(await res.json()).toEqual({ ok: true, duplicate: true })
        expect(calls.sqls.some(sql => sql.includes('question_stats'))).toBe(false)
        expect(db.batch).not.toHaveBeenCalled()
    })

    it('每 uuid 每小时超 12 批 → 429，且不落台账', async () => {
        const { db, calls } = makeDb({ rateN: 12 })
        const res = await post({ DB: db }, VALID_BODY)
        expect(res.status).toBe(429)
        expect(calls.sqls.some(sql => sql.includes('INSERT INTO sync_ledger'))).toBe(false)
    })

    it('未绑定 D1 → 503；体积超限 → 413；坏 JSON → 400', async () => {
        expect((await post({}, VALID_BODY)).status).toBe(503)
        const big = { ...VALID_BODY, junk: 'x'.repeat(17 * 1024) } // 撑过 16KB 上限（校验在体积检查之后）
        expect((await post({ DB: makeDb().db }, big)).status).toBe(413)
        expect((await post({ DB: makeDb().db }, null, { raw: '{broken' })).status).toBe(400)
    })

    it('畸形 items 逐项拒绝 → 400（版本/uuid/batchId/条目数/qid/科目/计数越界）', async () => {
        const env = { DB: makeDb().db }
        expect((await post(env, { ...VALID_BODY, v: 2 })).status).toBe(400)
        expect((await post(env, { ...VALID_BODY, uuid: 'x' })).status).toBe(400)
        expect((await post(env, { ...VALID_BODY, batchId: 'bad batch id!' })).status).toBe(400)
        expect((await post(env, { ...VALID_BODY, items: [] })).status).toBe(400)
        expect((await post(env, { ...VALID_BODY, items: [...VALID_BODY.items, ...Array.from({ length: 199 }, (_, i) => ({ qid: 'q' + i, s: 'Marx', a: 1, e: 0 }))] })).status).toBe(400)
        const item = (patch) => ({ ...VALID_BODY, items: [{ ...VALID_BODY.items[0], ...patch }] })
        expect((await post(env, item({ qid: '带空格的 id' }))).status).toBe(400)
        expect((await post(env, item({ s: 'ncre3' }))).status).toBe(400)
        expect((await post(env, item({ a: 0 }))).status).toBe(400)
        expect((await post(env, item({ a: 21 }))).status).toBe(400)
        expect((await post(env, item({ a: 1, e: 2 }))).status).toBe(400)
        expect((await post(env, item({ a: 1.5 }))).status).toBe(400)
    })

    it('DB 异常 → 500（客户端留存队列静默重试）', async () => {
        expect((await post({ DB: makeDb({ failAt: 'rate' }).db }, VALID_BODY)).status).toBe(500)
        expect((await post({ DB: makeDb({ failAt: 'ledger' }).db }, VALID_BODY)).status).toBe(500)
    })
})

describe('functions/api/wrongstats GET（聚合查询）', () => {
    const rows = [
        { question_id: '1798736702152376321', subject: 'Marx', attempts_sum: 30, errors_sum: 21 },
        { question_id: 'q2', subject: 'CMH', attempts_sum: 12, errors_sum: 3 }
    ]

    it('输出错误率聚合（rate = errors/attempts，三位小数）', async () => {
        const { db } = makeDb({ getResults: rows })
        const res = await get({ DB: db })
        expect(res.status).toBe(200)
        expect(res.headers.get('Cache-Control')).toContain('max-age=120')
        const data = await res.json()
        expect(data.v).toBe(1)
        expect(data.items).toEqual([
            { qid: '1798736702152376321', subject: 'Marx', attempts: 30, errors: 21, rate: 0.7 },
            { qid: 'q2', subject: 'CMH', attempts: 12, errors: 3, rate: 0.25 }
        ])
    })

    it('科目过滤走 subject = ?1 分支；非法科目 → 400', async () => {
        const { db, calls } = makeDb({ getResults: rows })
        const res = await get({ DB: db }, '?subject=Marx&limit=5&min_attempts=8')
        expect(res.status).toBe(200)
        expect(calls.sqls[0]).toContain('subject = ?1')
        expect(calls.sqls[0]).toContain('LIMIT ?3')
        expect((await get({ DB: makeDb().db }, '?subject=evil')).status).toBe(400)
    })

    it('limit 越界收敛到 1..200，非法数值回退默认；DB 异常 → 500；未绑定 → 503', async () => {
        const { db, calls } = makeDb({ getResults: [] })
        await get({ DB: db }, '?limit=9999')
        await get({ DB: db }, '?limit=abc')
        // 无科目分支绑定为 (min_attempts, limit)：9999 收敛 200，abc 回退默认 20
        expect(calls.binds[0]).toEqual([10, 200])
        expect(calls.binds[1]).toEqual([10, 20])
        expect(db.batch).not.toHaveBeenCalled()
        expect((await get({ DB: makeDb({ failAt: 'get' }).db })).status).toBe(500)
        expect((await get({})).status).toBe(503)
    })
})

describe('functions/api/wrongstats 兜底', () => {
    it('非 POST/GET → 405', async () => {
        const res = await onRequest({ request: new Request('https://site.example/api/wrongstats', { method: 'PUT' }) })
        expect(res.status).toBe(405)
    })
})
