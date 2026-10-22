import { describe, it, expect, beforeEach } from 'vitest'
import {
  encodeFavorites,
  decodeFavorites,
  parseFavoritesFile,
  mergeFavorites,
  encodeAllData,
  decodeAllData,
  collectViewedStates,
  restoreViewedStates,
  mergeAllData,
} from '../src/utils/favoritesSync'

const q = (id) => ({
  id,
  questionStem: `题目${id}`,
  option: ['A', 'B', 'C', 'D'],
  answer: 'A',
  collectedAt: '2026-06-01',
  appearCount: 3,
})

beforeEach(() => {
  localStorage.clear()
})

// 收藏夹导入导出是跨设备迁移的唯一通道，编解码 + 合并必须严格往返一致
describe('favoritesSync 编解码往返', () => {
  it('encode → decode 严格还原（含元数据字段）', () => {
    const list = [q('a'), q('b'), q('c')]
    const code = encodeFavorites(list)
    expect(typeof code).toBe('string')
    const { count, data } = decodeFavorites(code)
    expect(count).toBe(3)
    expect(data).toEqual(list)
  })

  it('兼容裸数组格式（旧版本导出）', async () => {
    const bare = JSON.stringify([q('x'), q('y')])
    // 直接构造裸数组压缩码：借道 encode 后替换不现实，用 LZString 手工压
    const LZString = (await import('lz-string')).default
    const code = LZString.compressToBase64(bare)
    const { count, data } = decodeFavorites(code)
    expect(count).toBe(2)
    expect(data[0].id).toBe('x')
  })

  it('乱码/截断的码抛出可读错误', () => {
    expect(() => decodeFavorites('###不完整的码###')).toThrow()
  })

  it('JSON 文件解析：envelope 与裸数组两种格式', async () => {
    const envelope = JSON.stringify({ v: 1, app: 'political_exam', count: 1, data: [q('f1')] })
    expect((await parseFavoritesFile(envelope)).count).toBe(1)
    const bare = JSON.stringify([q('f2')])
    expect((await parseFavoritesFile(bare)).data[0].id).toBe('f2')
    await expect(parseFavoritesFile('not json')).rejects.toThrow()
  })
})

describe('mergeFavorites 合并去重', () => {
  it('按 id 取并集，统计 added / duplicates', () => {
    const existing = [q('a'), q('b')]
    const incoming = [q('b'), q('c'), q('d')]
    const { merged, added, duplicates } = mergeFavorites(existing, incoming)
    expect(merged.map((x) => x.id)).toEqual(['a', 'b', 'c', 'd'])
    expect(added).toBe(2)
    expect(duplicates).toBe(1)
  })

  it('空端合并安全', () => {
    expect(mergeFavorites([], [q('a')]).merged).toHaveLength(1)
    expect(mergeFavorites([q('a')], []).duplicates).toBe(0)
  })
})

describe('全量数据导出导入', () => {
  it('encodeAllData → decodeAllData 往返一致', () => {
    const payload = {
      wrongQuestions: [q('w1')],
      likeList: [q('l1'), q('l2')],
      markList: [],
      userRecords: { w1: { questionId: 'w1', attempted: 3, errorCount: 2, lastErrorDate: '2026-07-01' } },
      viewedStates: { viewed_Marx: ['w1'] },
    }
    const { ts, data } = decodeAllData(encodeAllData(payload))
    expect(ts).toBeGreaterThan(0)
    expect(data).toEqual(payload)
  })

  it('非法码抛错', () => {
    expect(() => decodeAllData('garbage!!')).toThrow()
  })
})

describe('viewed_* 状态收集与还原', () => {
  it('collect → restore 往返', () => {
    localStorage.setItem('viewed_Marx', JSON.stringify(['1', '2']))
    localStorage.setItem('viewed_Marx_showAll', 'true')
    localStorage.setItem('unrelated_key', 'x')
    const states = collectViewedStates()
    expect(Object.keys(states).sort()).toEqual(['viewed_Marx', 'viewed_Marx_showAll'])

    localStorage.clear()
    restoreViewedStates(states)
    expect(JSON.parse(localStorage.getItem('viewed_Marx'))).toEqual(['1', '2'])
    expect(localStorage.getItem('viewed_Marx_showAll')).toBe('true')
    expect(localStorage.getItem('unrelated_key')).toBeNull()
  })
})

describe('mergeAllData 学习记录合并', () => {
  it('userRecords 保留更大的 attempted/errorCount，取更新的 lastErrorDate', () => {
    const existing = {
      wrongQuestions: [],
      likeList: [],
      markList: [],
      userRecords: {
        a: { questionId: 'a', attempted: 5, errorCount: 1, lastErrorDate: '2026-08-01' },
        b: { questionId: 'b', attempted: 2, errorCount: 2, lastErrorDate: '2026-07-01' },
      },
      viewedStates: {},
    }
    const incoming = {
      wrongQuestions: [q('w9')],
      likeList: [q('l9')],
      markList: [q('m9')],
      userRecords: {
        a: { questionId: 'a', attempted: 3, errorCount: 4, lastErrorDate: '2026-09-01' },
        c: { questionId: 'c', attempted: 1, errorCount: 1, lastErrorDate: '2026-09-02' },
      },
      viewedStates: { viewed_CMH: ['9'] },
    }
    const { merged, summary } = mergeAllData(existing, incoming)
    expect(merged.userRecords.a).toEqual({
      questionId: 'a',
      attempted: 5, // max(5,3)
      errorCount: 4, // max(1,4)
      lastErrorDate: '2026-09-01', // 更新的日期
    })
    expect(merged.userRecords.b.attempted).toBe(2) // 本地独有原样保留
    expect(merged.userRecords.c.attempted).toBe(1) // 导入独有直接采纳
    expect(merged.likeList.map((x) => x.id)).toEqual(['l9'])
    expect(merged.viewedStates.viewed_CMH).toEqual(['9'])
    expect(summary.likeAdded).toBe(1)
    expect(summary.recordsMerged).toBe(2)
  })
})

// 引擎字段（mastery/lastAttemptAt/dueAt/reviewStage）跨设备合并：胜者记录整体携带
describe('mergeAllData 引擎字段胜者携带', () => {
  const base = (userRecords) => ({
    wrongQuestions: [], likeList: [], markList: [], userRecords, viewedStates: {},
  })

  it('attempted 更大一端的引擎字段整体胜出；计数器仍按 max 合并', () => {
    const existing = base({
      a: { questionId: 'a', attempted: 10, errorCount: 2, lastErrorDate: '2026-08-01',
        mastery: 0.8, lastAttemptAt: 1000, reviewStage: 3, dueAt: 5000 },
    })
    const incoming = base({
      a: { questionId: 'a', attempted: 4, errorCount: 4, lastErrorDate: '2026-09-01',
        mastery: 0.2, lastAttemptAt: 2000, reviewStage: 0, dueAt: 3000 },
    })
    const rec = mergeAllData(existing, incoming).merged.userRecords.a
    expect(rec.attempted).toBe(10)              // max
    expect(rec.errorCount).toBe(4)              // max
    expect(rec.lastErrorDate).toBe('2026-09-01') // 更新日期
    expect(rec.mastery).toBe(0.8)               // winner（attempted 10 一端）整体携带
    expect(rec.lastAttemptAt).toBe(1000)
    expect(rec.reviewStage).toBe(3)
    expect(rec.dueAt).toBe(5000)
  })

  it('attempted 平手时按 errorCount 判胜（错得更多的一端更接近真实薄弱状态）', () => {
    const existing = base({
      a: { questionId: 'a', attempted: 5, errorCount: 1, mastery: 0.9, dueAt: 100 },
    })
    const incoming = base({
      a: { questionId: 'a', attempted: 5, errorCount: 3, mastery: 0.3, dueAt: 200 },
    })
    const rec = mergeAllData(existing, incoming).merged.userRecords.a
    expect(rec.mastery).toBe(0.3)
    expect(rec.dueAt).toBe(200)
  })

  it('旧格式记录（无引擎字段）合并后不产生引擎键，保持严格 toEqual 兼容', () => {
    const existing = base({
      a: { questionId: 'a', attempted: 5, errorCount: 1, lastErrorDate: '2026-08-01' },
    })
    const incoming = base({
      a: { questionId: 'a', attempted: 3, errorCount: 2, lastErrorDate: '2026-09-01' },
    })
    const rec = mergeAllData(existing, incoming).merged.userRecords.a
    expect(rec).toEqual({
      questionId: 'a',
      attempted: 5,
      errorCount: 2,
      lastErrorDate: '2026-09-01',
    })
    expect('mastery' in rec).toBe(false)
  })
})
