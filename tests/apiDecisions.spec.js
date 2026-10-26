import { describe, it, expect, vi } from 'vitest'
import { onRequestPost, onRequest } from '../functions/api/decisions'

// Pages Function（clef 通道）：AI binding 桩注入，Request/Response 走 Node 全局。
// 契约与线上实测一致：POST /api/decisions { state, questions } → { model, answers, usage }
const VALID_BODY = {
    state: { scenario: '练习错因分析', stem: '意识的本质是（）', userAnswer: 'C' },
    questions: {
        error_cause: { type: 'choice', instructions: '判断错因', criteria: { careless: '粗心' } },
        need_explain: { type: 'noul', instructions: '需要讲解吗？' }
    }
}

const stubAI = (result) => ({ run: vi.fn(async () => result) })

const call = (env, body, { raw } = {}) =>
    onRequestPost({
        request: new Request('https://site.example/api/decisions', {
            method: 'POST',
            body: raw ?? JSON.stringify(body)
        }),
        env
    })

describe('functions/api/decisions（clef 同域通道）', () => {
    it('正常透传：服务端固定 clef-flash，忽略客户端 model，原样返回模型输出', async () => {
        const ai = stubAI({ model: 'clef-flash', answers: {}, usage: { input_tokens: 1, output_tokens: 0 } })
        const res = await call({ AI: ai }, { ...VALID_BODY, model: 'typesafe/jev-1.13' })
        expect(res.status).toBe(200)
        expect(ai.run).toHaveBeenCalledTimes(1)
        expect(ai.run).toHaveBeenCalledWith('@cf/cloudflare/clef-flash', {
            model: 'clef-flash',
            state: VALID_BODY.state,
            questions: VALID_BODY.questions
        })
        const data = await res.json()
        expect(data).toEqual({ model: 'clef-flash', answers: {}, usage: { input_tokens: 1, output_tokens: 0 } })
    })

    it('未绑定 Workers AI → 503（页面侧 fail-open 消化）', async () => {
        const res = await call({}, VALID_BODY)
        expect(res.status).toBe(503)
    })

    it('体积超限 → 413；坏 JSON → 400', async () => {
        const ai = stubAI({})
        const big = { ...VALID_BODY, state: { ...VALID_BODY.state, blob: 'x'.repeat(9 * 1024) } }
        expect((await call({ AI: ai }, big)).status).toBe(413)
        expect((await call({ AI: ai }, null, { raw: '{broken' })).status).toBe(400)
        expect(ai.run).not.toHaveBeenCalled()
    })

    it('畸形 questions（数组 / 空 / 类型非法 / 超 8 问 / 坏 id）→ 400', async () => {
        const ai = stubAI({})
        expect((await call({ AI: ai }, { state: {}, questions: [] })).status).toBe(400)
        expect((await call({ AI: ai }, { state: {}, questions: {} })).status).toBe(400)
        expect((await call({ AI: ai }, { state: {}, questions: { q: { type: 'box', instructions: 'x' } } })).status).toBe(400)
        const many = {}
        for (let i = 0; i < 9; i++) many[`q${i}`] = { type: 'noul', instructions: 'x' }
        expect((await call({ AI: ai }, { state: {}, questions: many })).status).toBe(400)
        expect((await call({ AI: ai }, { state: {}, questions: { '坏 id!': { type: 'noul', instructions: 'x' } } })).status).toBe(400)
        expect(ai.run).not.toHaveBeenCalled()
    })

    it('缺 state / 缺 instructions → 400；AI.run 抛错 → 502', async () => {
        expect((await call({ AI: stubAI({}) }, { questions: VALID_BODY.questions })).status).toBe(400)
        expect((await call({ AI: stubAI({}) }, { state: {}, questions: { q: { type: 'noul' } } })).status).toBe(400)
        const boom = { run: async () => { throw new Error('model down') } }
        expect((await call({ AI: boom }, VALID_BODY)).status).toBe(502)
    })

    it('非 POST → 405', async () => {
        const res = await onRequest({ request: new Request('https://site.example/api/decisions') })
        expect(res.status).toBe(405)
    })
})
