import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useExamStore = defineStore('exam', () => {
  const userAnswers = ref({})

  function isCorrect(question, userAnswer) {
    if (!userAnswer) return false
    const type = getQuestionType(question)
    if (type === 'single-choice' || type === 'judgment') {
      return userAnswer === question.answer
    }
    if (type === 'multiple-choice') {
      const correct = question.answer.split('')
      return Array.isArray(userAnswer) &&
        userAnswer.length === correct.length &&
        correct.every(a => userAnswer.includes(a))
    }
    if (type === 'fill-in-the-blank') {
      return userAnswer.trim() === question.answer
    }
    return false
  }

  function getQuestionType(question) {
    if (!question.option || question.option.length === 0) return 'fill-in-the-blank'
    if (question.option.length === 2) return 'judgment'
    if (question.answer.length > 1) return 'multiple-choice'
    return 'single-choice'
  }

  function reset() {
    userAnswers.value = {}
  }

  return { userAnswers, isCorrect, getQuestionType, reset }
})
