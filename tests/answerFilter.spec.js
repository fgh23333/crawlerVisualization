import { describe, it, expect } from 'vitest'
import {
  maxOptionLetters,
  answerOptionsFor,
  filterByAnswer,
} from '../src/utils/answerFilter'

// 背题模式答案筛选：判断题筛「答案=错误」、单选筛指定选项、多选按「含选项」
const judge = (ans) => ({ id: ans, option: ['正确', '错误'], answer: ans })
const single = (ans, n = 4) => ({ id: ans, option: Array.from({ length: n }, (_, i) => '选项' + i), answer: ans })
const multi = (ans) => ({ id: ans, option: ['a', 'b', 'c', 'd'], answer: ans })

describe('maxOptionLetters 候选字母', () => {
  it('取列表最大选项数，A 起步，封顶 H', () => {
    expect(maxOptionLetters([single('A'), single('B', 6)])).toEqual(['A', 'B', 'C', 'D', 'E', 'F'])
    expect(maxOptionLetters([])).toEqual([])
    expect(maxOptionLetters(null)).toEqual([])
    expect(maxOptionLetters([single('A', 12)])).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'])
  })
})

describe('answerOptionsFor 筛选项构造', () => {
  it('判断 → 正确/错误；单选 → 答案=字母；多选 → 含选项字母；其余题型为空（隐藏入口）', () => {
    expect(answerOptionsFor('rightWrong', [])).toEqual([
      { label: '答案=正确', value: '正确' },
      { label: '答案=错误', value: '错误' },
    ])
    const singles = answerOptionsFor('singleChoice', [single('A'), single('B', 5)])
    expect(singles).toHaveLength(5)
    expect(singles[0]).toEqual({ label: '答案=A', value: 'A' })
    const multis = answerOptionsFor('multipleChoice', [multi('AB')])
    expect(multis[0]).toEqual({ label: '含选项A', value: 'A' })
    expect(answerOptionsFor('subject', [single('A')])).toEqual([])
    expect(answerOptionsFor('fillingBlank', [])).toEqual([])
  })
})

describe('filterByAnswer 过滤', () => {
  it('判断题全等匹配：筛「错误」只剩答案为错误的题', () => {
    const list = [judge('正确'), judge('错误'), judge('正确'), judge('错误')]
    expect(filterByAnswer(list, '错误').map(q => q.id)).toEqual(['错误', '错误'])
    expect(filterByAnswer(list, '正确')).toHaveLength(2)
  })

  it('单选全等 / 多选包含匹配（每题按自身形状复核题型）', () => {
    const list = [single('A'), single('C'), multi('AB'), multi('BCD'), judge('错误')]
    expect(filterByAnswer(list, 'A').map(q => q.id)).toEqual(['A', 'AB'])
    expect(filterByAnswer(list, 'C').map(q => q.id)).toEqual(['C', 'BCD'])
  })

  it('空筛选值原样返回；空列表/null 容错', () => {
    const list = [judge('正确')]
    expect(filterByAnswer(list, '')).toBe(list)
    expect(filterByAnswer(null, 'A')).toEqual([])
    expect(filterByAnswer(list, 'A')).toEqual([])
  })
})
