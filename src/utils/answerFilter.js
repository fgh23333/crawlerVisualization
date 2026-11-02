/**
 * 答案筛选（背题模式）—— 按标准答案过滤题列表，纯函数、零 Vue 依赖。
 *
 * 场景来自问卷 #89 / #167 / #55 / #100：抱佛脚背题时想只看「答案=错误」的
 * 判断题、答案为指定选项的单选题（多选按「包含该选项」）。
 * 仅对单一题型的列表有意义（判断/单选/多选）；混合列表（总题库/收藏夹）
 * 由调用方决定不展示该筛选（answerOptionsFor 返回空数组即隐藏）。
 */
import { getQuestionType } from './questionType'

const LETTERS = 'ABCDEFGH'

/** 单选/多选的候选字母：取列表中出现的最大选项数（A 起，封顶 H 防脏数据） */
export function maxOptionLetters(list) {
  let max = 0
  for (const q of list || []) {
    const n = Array.isArray(q?.option) ? q.option.length : 0
    if (n > max) max = n
  }
  return LETTERS.slice(0, Math.min(max, LETTERS.length)).split('')
}

/**
 * 构造某题型的答案筛选项
 * @param {'rightWrong'|'singleChoice'|'multipleChoice'} type 路由题型
 * @returns [{label, value}] 判断 → 答案=正确/错误；单选 → 答案=A..；多选 → 含A..
 */
export function answerOptionsFor(type, list) {
  if (type === 'rightWrong') {
    return [
      { label: '答案=正确', value: '正确' },
      { label: '答案=错误', value: '错误' }
    ]
  }
  if (type === 'singleChoice' || type === 'multipleChoice') {
    return maxOptionLetters(list).map(L => ({
      label: type === 'singleChoice' ? `答案=${L}` : `含选项${L}`,
      value: L
    }))
  }
  return []
}

/**
 * 应用答案筛选：判断/单选全等匹配，多选为 answer.includes（含该选项）；
 * 每题先按自身形状复核题型（收藏夹混合列表即便带上也不至于错杀）。
 * filterValue 为空原样返回（浅拷贝由调用方决定）。
 */
export function filterByAnswer(list, filterValue, type) {
  if (!filterValue) return list || []
  const out = []
  for (const q of list || []) {
    if (!q) continue
    const t = getQuestionType(q) || type
    if (t === 'multipleChoice') {
      if (typeof q.answer === 'string' && q.answer.includes(filterValue)) out.push(q)
    } else if (q.answer === filterValue) {
      out.push(q)
    }
  }
  return out
}
