export type QuestionType = 'rightWrong' | 'singleChoice' | 'multipleChoice' | 'fillingBlank'

export function getQuestionType(question: {
  option?: string[] | string
  answer?: string
}): QuestionType | null {
  const { option, answer } = question
  if (!option || option.length === 0) return 'fillingBlank'
  if (option.length === 2) return 'rightWrong'
  if (answer && answer.length === 1) return 'singleChoice'
  if (answer && answer.length > 1) return 'multipleChoice'
  return null
}

export const TYPE_LABEL: Record<QuestionType, string> = {
  rightWrong: '判断',
  singleChoice: '单选',
  multipleChoice: '多选',
  fillingBlank: '填空'
}
