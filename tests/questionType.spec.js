import { describe, it, expect } from 'vitest'
import { getQuestionType, TYPE_LABEL } from '../src/utils/questionType'

// 题型判断是渲染与筛选的基础规则，与 Worker 端 retrieve.js deriveType 同构
describe('getQuestionType 题型判断', () => {
  it('option 为空数组 → 填空题', () => {
    expect(getQuestionType({ option: [], answer: '矛盾' })).toBe('fillingBlank')
  })

  it('option 缺失 → 填空题', () => {
    expect(getQuestionType({ answer: '矛盾' })).toBe('fillingBlank')
  })

  it('两个选项 → 判断题', () => {
    expect(getQuestionType({ option: ['正确', '错误'], answer: '正确' })).toBe('rightWrong')
  })

  it('单字母答案 → 单选题', () => {
    expect(getQuestionType({ option: ['A', 'B', 'C', 'D'], answer: 'A' })).toBe('singleChoice')
  })

  it('多字母答案 → 多选题', () => {
    expect(getQuestionType({ option: ['A', 'B', 'C', 'D'], answer: 'ABD' })).toBe('multipleChoice')
  })

  it('有选项但答案缺失 → null（无法判断，不误标）', () => {
    expect(getQuestionType({ option: ['A', 'B', 'C'] })).toBeNull()
  })

  it('TYPE_LABEL 覆盖四种题型', () => {
    expect(Object.keys(TYPE_LABEL).sort()).toEqual(['fillingBlank', 'multipleChoice', 'rightWrong', 'singleChoice'])
  })
})
