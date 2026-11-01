import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
    isStatsEnabled,
    setStatsEnabled,
    getClientUuid,
    noteAnswer,
    flushWrongStats,
    initWrongStats
} from '../src/utils/wrongStats'

// 匿名错题采集（客户端）：localStorage 键一律 wstats_*，绝不用 qb_ 前缀
// （loadJson 版本热更新会清 qb_*，采集队列不能被误清）。全程静默容错。

const pending = () => JSON.parse(localStorage.getItem('wstats_pending') || '{}')

beforeEach(() => {
    localStorage.clear()
})

afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
})

describe('开关与客户端标识', () => {
    it('默认开启；显式 false 才关；损坏值按开处理', () => {
        expect(isStatsEnabled()).toBe(true)
        setStatsEnabled(false)
        expect(isStatsEnabled()).toBe(false)
        setStatsEnabled(true)
        expect(isStatsEnabled()).toBe(true)
        localStorage.setItem('wstats_enabled', 'broken')
        expect(isStatsEnabled()).toBe(true)
    })

    it('关闭共享时丢弃未上送增量', () => {
        noteAnswer('q1', 'Marx', true)
        expect(pending()).toEqual({ q1: { s: 'Marx', a: 1, e: 0 } })
        setStatsEnabled(false)
        expect(localStorage.getItem('wstats_pending')).toBe(null)
    })

    it('getClientUuid 首次生成后稳定', () => {
        const a = getClientUuid()
        expect(a).toBeTruthy()
        expect(getClientUuid()).toBe(a)
        expect(a).toMatch(/^[A-Za-z0-9-]{8,64}$/)
    })
})

describe('noteAnswer 增量累计', () => {
    it('同题合并累加，先落盘后发送', () => {
        noteAnswer('q1', 'Marx', true)
        noteAnswer('q1', 'Marx', false)
        noteAnswer('q1', 'Marx', false)
        expect(pending()).toEqual({ q1: { s: 'Marx', a: 3, e: 2 } })
    })

    it('非思政九科（如 ncre3）不入队；关闭后 no-op', () => {
        noteAnswer('q9', undefined, false)
        noteAnswer('q9', 'ncre3', false)
        expect(pending()).toEqual({})
        setStatsEnabled(false)
        noteAnswer('q1', 'Marx', false)
        expect(pending()).toEqual({})
    })

    it('条目超 200 时按插入序丢最旧（FIFO）', () => {
        for (let i = 0; i < 205; i++) noteAnswer('q' + i, 'Marx', false)
        const keys = Object.keys(pending())
        expect(keys.length).toBe(200)
        expect(keys[0]).toBe('q5')
        expect(keys[199]).toBe('q204')
    })
})

describe('flushWrongStats 冲刷', () => {
    const okResponse = () => ({ ok: true, json: async () => ({ ok: true }) })

    it('fetch 成功（200 + ok:true）才清队列；batchId 随 seq 递增', async () => {
        noteAnswer('q1', 'Marx', false)
        const fetchMock = vi.fn(async () => okResponse())
        vi.stubGlobal('fetch', fetchMock)

        await flushWrongStats()
        expect(fetchMock).toHaveBeenCalledTimes(1)
        const [url, init] = fetchMock.mock.calls[0]
        expect(url).toBe('/api/wrongstats')
        expect(init.method).toBe('POST')
        const payload = JSON.parse(init.body)
        expect(payload.v).toBe(1)
        expect(payload.batchId).toMatch(/^[A-Za-z0-9-]+-0001$/)
        expect(payload.items).toEqual([{ qid: 'q1', s: 'Marx', a: 1, e: 1 }])
        expect(pending()).toEqual({})

        // 队列已空：不再发起请求
        await flushWrongStats()
        expect(fetchMock).toHaveBeenCalledTimes(1)

        // 新增量走下一批（seq 递增，服务端凭 batchId 幂等）
        noteAnswer('q2', 'CMH', true)
        await flushWrongStats()
        const payload2 = JSON.parse(fetchMock.mock.calls[1][1].body)
        expect(payload2.batchId).toMatch(/-0002$/)
    })

    it('HTTP 非 200 或响应缺 ok:true → 队列留存待重试', async () => {
        noteAnswer('q1', 'Marx', false)
        vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false })))
        await flushWrongStats()
        expect(pending()).toEqual({ q1: { s: 'Marx', a: 1, e: 1 } })

        vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ ok: false }) })))
        await flushWrongStats()
        expect(pending()).toEqual({ q1: { s: 'Marx', a: 1, e: 1 } })
    })

    it('beacon 模式（页面隐藏）：sendBeacon 发送后直接清队列', async () => {
        noteAnswer('q1', 'Marx', false)
        const beacon = vi.fn(() => true)
        vi.stubGlobal('navigator', { sendBeacon: beacon })
        const fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)

        await flushWrongStats({ beacon: true })
        expect(beacon).toHaveBeenCalledTimes(1)
        const [url, blob] = beacon.mock.calls[0]
        expect(url).toBe('/api/wrongstats')
        expect(blob).toBeInstanceOf(Blob)
        expect(pending()).toEqual({})
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('fetch 抛错（网络断）→ 静默且队列留存', async () => {
        noteAnswer('q1', 'Marx', false)
        vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline') }))
        await flushWrongStats()
        expect(pending()).toEqual({ q1: { s: 'Marx', a: 1, e: 1 } })
    })
})

describe('initWrongStats 触发器', () => {
    it('启动 5s 后冲刷一次；重复调用不重复注册', async () => {
        vi.useFakeTimers()
        try {
            noteAnswer('q1', 'Marx', true)
            const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ ok: true }) }))
            vi.stubGlobal('fetch', fetchMock)

            initWrongStats()
            initWrongStats()
            await vi.advanceTimersByTimeAsync(4999)
            expect(fetchMock).not.toHaveBeenCalled()
            await vi.advanceTimersByTimeAsync(1)
            expect(fetchMock).toHaveBeenCalledTimes(1)
            // 定时周期 5 分钟：未到不重复冲刷
            await vi.advanceTimersByTimeAsync(60 * 1000)
            expect(fetchMock).toHaveBeenCalledTimes(1)
        } finally {
            vi.useRealTimers()
        }
    })
})
