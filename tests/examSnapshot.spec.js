import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import {
  countAnswered,
  matchesSnapshot,
  validateSnapshot,
  saveExamSnapshot,
  loadExamSnapshot,
  clearExamSnapshot
} from '../src/utils/examSnapshot'
import { useQuestionStore } from '../src/stores/question'

// 考试作答进度快照：意外退出（关页/崩溃/误触返回）后可恢复最近一次未提交作答。
// 校验是纯函数（now 可注入），存取薄封装 localStorage 单槽位，7 天过期。
beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
})

const makeQuestions = (n) =>
  Array.from({ length: n }, (_, i) => ({
    id: `q_${i}`,
    questionStem: `第${i}题`,
    option: ['A', 'B', 'C', 'D'],
    answer: 'A'
  }))

// 校验注入的基准时刻（2030-01，远晚于 Date.now()，保证默认快照未过期）
const NOW = 1_900_000_000_000

const makeSnapshot = (overrides = {}) => ({
  v: 1,
  kind: 'sizheng',
  lesson: 'Marx',
  paperId: '3',
  questions: makeQuestions(3),
  answerList: ['A', '', ['A', 'B']],
  answerTouches: { 0: { first: 1, last: 2 } },
  elapsed: 125,
  savedAt: NOW - 1000,
  ...overrides
})

describe('countAnswered 已答计数', () => {
  it('非空字符串与非空数组计为已答，空白/undefined 不计', () => {
    expect(countAnswered(['A', '', '  ', ['A', 'B'], [], undefined, null])).toBe(2)
  })

  it('非数组输入返回 0', () => {
    expect(countAnswered(null)).toBe(0)
    expect(countAnswered(undefined)).toBe(0)
  })
})

describe('matchesSnapshot 槽位匹配', () => {
  const snap = makeSnapshot()

  it('kind + lesson + paperId 三元组全等才匹配', () => {
    expect(matchesSnapshot(snap, { kind: 'sizheng', lesson: 'Marx', paperId: '3' })).toBe(true)
    expect(matchesSnapshot(snap, { kind: 'ncre3', lesson: 'Marx', paperId: '3' })).toBe(false)
    expect(matchesSnapshot(snap, { kind: 'sizheng', lesson: 'CMH', paperId: '3' })).toBe(false)
    expect(matchesSnapshot(snap, { kind: 'sizheng', lesson: 'Marx', paperId: 'random' })).toBe(false)
  })

  it('paperId 数字入参按字符串比较（路由参数类型漂移防御）', () => {
    expect(matchesSnapshot(snap, { kind: 'sizheng', lesson: 'Marx', paperId: 3 })).toBe(true)
  })

  it('空快照不匹配', () => {
    expect(matchesSnapshot(null, { kind: 'sizheng', lesson: 'Marx', paperId: '3' })).toBe(false)
  })
})

describe('validateSnapshot 纯函数校验', () => {
  const now = 1_900_000_000_000

  it('合法快照原样通过，answerTouches 缺省补空对象', () => {
    const snap = validateSnapshot(makeSnapshot({ answerTouches: undefined }), now)
    expect(snap).not.toBeNull()
    expect(snap.answerTouches).toEqual({})
  })

  it('7 天内有效，过期作废', () => {
    expect(validateSnapshot(makeSnapshot({ savedAt: now - 6.9 * 864e5 }), now)).not.toBeNull()
    expect(validateSnapshot(makeSnapshot({ savedAt: now - 7.1 * 864e5 }), now)).toBeNull()
  })

  it('savedAt 超前当前时间 1 天以上视为无效（时钟回拨防御）', () => {
    expect(validateSnapshot(makeSnapshot({ savedAt: now + 2 * 864e5 }), now)).toBeNull()
  })

  it('版本不符 / 缺字段 / 类型不对一律作废', () => {
    expect(validateSnapshot(makeSnapshot({ v: 2 }), now)).toBeNull()
    expect(validateSnapshot(makeSnapshot({ questions: [] }), now)).toBeNull()
    expect(validateSnapshot(makeSnapshot({ answerList: ['A'] }), now)).toBeNull() // 长度与题目数不符
    expect(validateSnapshot(makeSnapshot({ elapsed: -1 }), now)).toBeNull()
    expect(validateSnapshot(makeSnapshot({ elapsed: NaN }), now)).toBeNull()
    expect(validateSnapshot(makeSnapshot({ kind: 3 }), now)).toBeNull()
    expect(validateSnapshot(makeSnapshot({ questions: [{ id: 'q', questionStem: 1 }] }), now)).toBeNull()
    expect(validateSnapshot(null, now)).toBeNull()
  })
})

describe('localStorage 存取', () => {
  it('save → load 往返一致（savedAt 由 save 时盖戳）', () => {
    const before = Date.now()
    saveExamSnapshot(makeSnapshot({ savedAt: undefined }))
    const snap = loadExamSnapshot()
    expect(snap.lesson).toBe('Marx')
    expect(snap.questions).toHaveLength(3)
    expect(snap.answerList).toEqual(['A', '', ['A', 'B']])
    expect(snap.elapsed).toBe(125)
    expect(snap.savedAt).toBeGreaterThanOrEqual(before)
  })

  it('空槽位 load 返回 null 不抛错', () => {
    expect(loadExamSnapshot()).toBeNull()
  })

  it('损坏 JSON → null 且槽位被清理', () => {
    localStorage.setItem('exam_snapshot', '{broken json')
    expect(loadExamSnapshot()).toBeNull()
    expect(localStorage.getItem('exam_snapshot')).toBeNull()
  })

  it('存入后内容损坏（load 校验不过）也会清槽位', () => {
    saveExamSnapshot(makeSnapshot())
    localStorage.setItem('exam_snapshot', JSON.stringify(makeSnapshot({ v: 2 })))
    expect(loadExamSnapshot()).toBeNull()
    expect(localStorage.getItem('exam_snapshot')).toBeNull()
  })

  it('写入抛错（配额满）不向上抛，且清掉槽位', () => {
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    expect(() => saveExamSnapshot(makeSnapshot())).not.toThrow()
    localStorage.setItem.mockRestore()
    // save 内部的 clear 走 removeItem（未被 mock），槽位已清空
    expect(localStorage.getItem('exam_snapshot')).toBeNull()
  })

  it('clearExamSnapshot 幂等', () => {
    clearExamSnapshot()
    clearExamSnapshot()
    expect(localStorage.getItem('exam_snapshot')).toBeNull()
  })
})

// store 集成：落盘入口的空卷防御 + 提交判分后快照作废
describe('question store 集成', () => {
  it('saveExamProgress：未答 / 空 bank 不落盘；有作答正常落盘', () => {
    const store = useQuestionStore()
    store.loadQuestionBank(makeQuestions(3))
    store.saveExamProgress('sizheng', 'Marx', '3', 60)
    expect(localStorage.getItem('exam_snapshot')).toBeNull() // 一题未答不覆盖槽位

    store.answerList = ['A', '', '']
    store.saveExamProgress('sizheng', 'Marx', '3', 60)
    const snap = loadExamSnapshot()
    expect(snap).not.toBeNull()
    expect(snap.answerList).toEqual(['A', '', ''])
  })

  it('restoreExamProgress：题目入 bank、快照挂 pendingRestore 待 examRecord 消费', () => {
    const store = useQuestionStore()
    store.loadQuestionBank(makeQuestions(2))
    store.answerList = ['A', 'B']
    store.touchAnswer(0)
    store.saveExamProgress('ncre3', 'ncre3', 'theory', 42)

    store.loadQuestionBank([]) // 模拟重新进入页面
    expect(store.pendingRestore).toBeNull()

    const snap = loadExamSnapshot()
    store.restoreExamProgress(snap)
    expect(store.questionBank).toHaveLength(2)
    // 经 reactive store 取出的是代理对象，须深比较而非身份比较
    expect(store.pendingRestore).toStrictEqual(snap)
    expect(store.answerTouches[0]).toBeDefined() // 耗时数据随快照复原
  })

  it('checkAnswer 判分完成后清空快照（考试终结）', async () => {
    const store = useQuestionStore()
    const questions = makeQuestions(2)
    store.loadQuestionBank(questions)
    // 题目答案均为 'A'，两题全对得分 2
    store.answerList = ['A', 'A']
    store.saveExamProgress('sizheng', 'Marx', '3', 30)
    expect(localStorage.getItem('exam_snapshot')).not.toBeNull()

    await store.checkAnswer(true)
    expect(store.score).toBe(2)
    expect(localStorage.getItem('exam_snapshot')).toBeNull()
  })
})
