const randomPick = async (subject, type, count) => {
  const questions = await import(`@/assets/${subject}_${type}.json`)

  if (count >= questions.default.length) return questions // 如果数量超出，返回所有题目
  const shuffled = [...questions.default].sort(() => Math.random() - 0.5) // 打乱顺序
  return shuffled.slice(0, count) // 取前 count 个
}

async function generateQuiz(subject, options) {
  // 设置默认值
  const defaultOptions = { single: 20, multiple: 15, blank: 10, trueFalse: 15 }
  options = { ...defaultOptions, ...options } // 合并默认值和用户提供的值

  const single = await randomPick(subject, 'singleChoice', options.single)
  const multiple = await randomPick(subject, 'multipleChoice', options.multiple)
  const blank = await randomPick(subject, 'fillingBlank', options.blank)
  const trueFalse = await randomPick(subject, 'rightWrong', options.trueFalse)

  return [...single, ...multiple, ...trueFalse, ...blank] // 合并题目
}

export default generateQuiz
