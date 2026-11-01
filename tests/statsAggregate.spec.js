import { describe, it, expect, beforeEach } from 'vitest'
import {
  SUBJECT_CODES,
  typeOfQuestion,
  formatShanghaiTime,
  buildListIndex,
  parseBankCacheKey,
  buildBankIndexFromCache,
  subjectAggregates,
  typeAggregates,
  rankQuestions,
  examTrend,
  overallKpis,
} from '../src/utils/statsAggregate'

// 统计聚合器：统计页的全部数字都出自这里，口径必须在纯函数层锁死
beforeEach(() => {
  localStorage.clear()
})

const rec = (attempted, errorCount, extra = {}) => ({
  questionId: 'x', attempted, errorCount, lastErrorDate: null, ...extra,
})

describe('typeOfQuestion 题型推断（与 store getType 同口径）', () => {
  it('无选项=填空，两选项=判断，答案多位=多选，其余单选', () => {
    expect(typeOfQuestion({ option: [], answer: '社会属性' })).toBe('填空')
    expect(typeOfQuestion({ option: ['正确', '错误'], answer: 'A' })).toBe('判断')
    expect(typeOfQuestion({ option: ['a', 'b', 'c', 'd'], answer: 'AB' })).toBe('多选')
    expect(typeOfQuestion({ option: ['a', 'b', 'c', 'd'], answer: 'A' })).toBe('单选')
    expect(typeOfQuestion(null)).toBeNull()
  })
})

describe('formatShanghaiTime 固定 UTC+8', () => {
  it('任意时区运行环境都输出上海时区的 YYYY-MM-DD HH:mm', () => {
    // 2026-11-01 04:30 UTC = 2026-11-01 12:30 UTC+8
    const ts = Date.UTC(2026, 10, 1, 4, 30, 0)
    expect(formatShanghaiTime(ts)).toBe('2026-11-01 12:30')
  })

  it('跨日边界与非法输入', () => {
    // 2026-11-01 16:05 UTC = 2026-11-02 00:05 UTC+8
    expect(formatShanghaiTime(Date.UTC(2026, 10, 1, 16, 5))).toBe('2026-11-02 00:05')
    expect(formatShanghaiTime(undefined)).toBe('')
    expect(formatShanghaiTime(NaN)).toBe('')
  })
})

describe('buildListIndex 列表元数据索引', () => {
  it('三张列表并集、同 id 首个胜、科目只认九科', () => {
    const wrong = [{ id: '1', questionStem: '题一', option: [], answer: 'x', abbreviationSubject: 'Marx' }]
    const like = [
      { id: '1', questionStem: '题一重复', option: [], answer: 'x', abbreviationSubject: 'Marx' },
      { id: '2', questionStem: '题二', option: ['a', 'b', 'c', 'd'], answer: 'A', abbreviationSubject: 'CMH' },
    ]
    const mark = [{ id: '3', questionStem: 'ncre3 题', option: [], answer: 'x' }]
    const index = buildListIndex([wrong, like, mark])
    expect(index.size).toBe(3)
    expect(index.get('1').stem).toBe('题一') // 首个胜，不被后表覆盖
    expect(index.get('2')).toEqual({ stem: '题二', subject: 'CMH', type: '单选' })
    expect(index.get('3').subject).toBeNull() // 非九科 → null
    expect(buildListIndex(null).size).toBe(0)
  })
})

describe('题库缓存键解析与扫描', () => {
  it('parseBankCacheKey 只认九科 lesson', () => {
    expect(parseBankCacheKey('qb__rewrite_Marx_subject_json')).toEqual({ lesson: 'Marx', type: 'subject' })
    expect(parseBankCacheKey('qb__rewrite_CMH_singleChoice_json')).toEqual({ lesson: 'CMH', type: 'singleChoice' })
    expect(parseBankCacheKey('qb__rewrite_ncre3_theory_json')).toBeNull()
    expect(parseBankCacheKey('qb_version')).toBeNull()
    expect(parseBankCacheKey('qb__cura_Marx_1_json')).toBeNull()
  })

  it('buildBankIndexFromCache 扫描缓存并跳过损坏条目', async () => {
    localStorage.setItem('qb__rewrite_Marx_subject_json', JSON.stringify([
      { id: '100', questionStem: '缓存题', option: ['a', 'b'], answer: 'A' },
    ]))
    localStorage.setItem('qb__rewrite_CMH_fillingBlank_json', '{broken json')
    localStorage.setItem('qb__rewrite_Unknown_lesson_json', '[]')
    const { index, files } = await buildBankIndexFromCache()
    expect(files).toBe(3)
    expect(index.size).toBe(1)
    expect(index.get('100')).toEqual({ stem: '缓存题', subject: 'Marx', type: '判断' })
  })

  it('进度回调按文件推进', async () => {
    localStorage.setItem('qb__rewrite_Marx_subject_json', '[]')
    localStorage.setItem('qb__rewrite_CMH_subject_json', '[]')
    const seen = []
    await buildBankIndexFromCache((done, total) => seen.push([done, total]))
    expect(seen).toEqual([[1, 2], [2, 2]])
  })
})

describe('subjectAggregates 科目聚合', () => {
  it('record.subject 优先、元数据兜底、未知科目计入 uncovered', () => {
    const records = {
      a: rec(4, 1, { subject: 'Marx' }),          // 记录自带科目
      b: rec(2, 0),                                // 无 subject → 走元数据
      c: rec(3, 3, { subject: 'ncre3' }),          // 非九科 → uncovered
    }
    const metaOf = (id) => (id === 'b' ? { stem: '题', subject: 'CMH', type: '单选' } : null)
    const { rows, uncovered } = subjectAggregates(records, metaOf)
    expect(uncovered).toBe(1)
    expect(rows.map(r => r.subject)).toEqual(['Marx', 'CMH']) // 按作答次数降序
    expect(rows[0]).toMatchObject({ subject: 'Marx', label: '马原', attempted: 4, errors: 1, accuracy: 0.75 })
    expect(rows[1].accuracy).toBe(1)
  })

  it('attempted=0 的占位记录不计入', () => {
    const { rows, uncovered } = subjectAggregates({ a: rec(0, 0) }, () => null)
    expect(rows).toEqual([])
    expect(uncovered).toBe(0)
  })
})

describe('typeAggregates 题型聚合', () => {
  it('按元数据题型归桶，无题型/无科目的记录计 uncovered', () => {
    const records = {
      a: rec(2, 0, { subject: 'Marx' }),
      b: rec(3, 1, { subject: 'CMH' }),
      c: rec(1, 1), // 无元数据
    }
    const metaOf = (id) => ({
      a: { stem: '', subject: 'Marx', type: '单选' },
      b: { stem: '', subject: 'CMH', type: '填空' },
    }[id])
    const { rows, uncovered } = typeAggregates(records, metaOf)
    expect(uncovered).toBe(1)
    // 行序按 TYPE_ORDER（判断/单选/多选/填空）固定，不随作答量变
    expect(rows.map(r => r.type)).toEqual(['单选', '填空'])
    expect(rows[0]).toMatchObject({ type: '单选', attempted: 2, accuracy: 1 })
    expect(rows[1].accuracy).toBeCloseTo(1 - 1 / 3)
  })
})

describe('rankQuestions 正确率榜单', () => {
  const records = {
    good: rec(5, 0, { subject: 'Marx' }),
    bad: rec(5, 4, { subject: 'Marx' }),
    mid: rec(4, 2, { subject: 'CMH' }),
    few: rec(2, 2, { subject: 'CMH' }),        // attempted < 阈值
    nocre: rec(9, 9),                           // 无科目 → 排除
  }
  const metaOf = (id) => ({
    good: { stem: '掌握得好', subject: 'Marx', type: '单选' },
    bad: { stem: '总出错', subject: 'Marx', type: '多选' },
    mid: { stem: '一般', subject: 'CMH', type: '判断' },
    few: { stem: '刚做两次', subject: 'CMH', type: '单选' },
  }[id])

  it('worst：低正确率在前，尊重 minAttempts 阈值', () => {
    const rows = rankQuestions(records, metaOf, { minAttempts: 3, order: 'worst' })
    expect(rows.map(r => r.id)).toEqual(['bad', 'mid', 'good'])
    expect(rows[0]).toMatchObject({ stem: '总出错', attempted: 5 })
    expect(rows[0].accuracy).toBeCloseTo(0.2)
  })

  it('best：高正确率在前；阈值抬高后不足的题掉出榜单', () => {
    expect(rankQuestions(records, metaOf, { minAttempts: 3, order: 'best' }).map(r => r.id))
      .toEqual(['good', 'mid', 'bad'])
    expect(rankQuestions(records, metaOf, { minAttempts: 5, order: 'best' }).map(r => r.id))
      .toEqual(['good', 'bad'])
  })

  it('limit 截断', () => {
    expect(rankQuestions(records, metaOf, { minAttempts: 3, limit: 2, order: 'worst' })).toHaveLength(2)
  })
})

describe('examTrend 考试趋势', () => {
  const history = [
    { kind: 'sizheng', lesson: 'Marx', paperId: '1', score: 80, total: 100, ts: 3000, date: '2026-11-01 10:00' },
    { kind: 'sizheng', lesson: 'CMH', paperId: 'random', score: 90, total: 100, ts: 1000, date: '2026-10-30 09:00' },
    { kind: 'sizheng', lesson: 'Marx', paperId: '2', score: 60, total: 100, ts: 2000, date: '2026-10-31 20:00' },
    { kind: 'ncre3', lesson: 'ncre3', paperId: 'theory', score: 50, total: 100, ts: 4000 },
    { kind: 'sizheng', lesson: 'Marx', paperId: '3', score: null, total: 100, ts: 5000 }, // 非法分数剔除
  ]

  it('仅取思政卷并按时间升序，rate = 得分率', () => {
    const { points, summary } = examTrend(history)
    expect(points.map(p => p.paperId)).toEqual(['random', '2', '1'])
    expect(points[0].rate).toBe(90)
    expect(points[2].label).toBe('马原')
    expect(summary.count).toBe(3)
    expect(summary.avgRate).toBe(76.7) // (90+60+80)/3
  })

  it('按科目过滤', () => {
    const { points } = examTrend(history, { lesson: 'Marx' })
    expect(points.map(p => p.paperId)).toEqual(['2', '1'])
  })

  it('空历史安全', () => {
    expect(examTrend([]).points).toEqual([])
    expect(examTrend(null).summary.avgRate).toBeNull()
  })
})

describe('overallKpis 顶部指标', () => {
  it('累计/正确率/待复习/思政考试场次', () => {
    const userRecords = {
      a: rec(10, 4, { dueAt: Date.now() - 1 }),   // 已到期
      b: rec(6, 0, { dueAt: Date.now() + 99999 }), // 未到期
    }
    const wrongQuestions = [{ id: 'a' }, { id: 'b' }, { id: 'noRecord' }] // 无记录的错题视为到期
    const examHistory = [
      { kind: 'sizheng' }, { kind: 'sizheng' }, { kind: 'ncre3' },
    ]
    const kpis = overallKpis(userRecords, wrongQuestions, examHistory)
    expect(kpis.totalAttempts).toBe(16)
    expect(kpis.totalErrors).toBe(4)
    expect(kpis.accuracy).toBeCloseTo(0.75)
    expect(kpis.dueCount).toBe(2) // a + noRecord
    expect(kpis.examCount).toBe(2)
  })

  it('空数据不除零', () => {
    const kpis = overallKpis({}, [], [])
    expect(kpis.accuracy).toBeNull()
    expect(kpis.dueCount).toBe(0)
  })
})

describe('SUBJECT_CODES 常量', () => {
  it('九科齐全', () => {
    expect(SUBJECT_CODES).toHaveLength(9)
    expect(SUBJECT_CODES).toContain('Marx')
    expect(SUBJECT_CODES).toContain('ORH')
  })
})
