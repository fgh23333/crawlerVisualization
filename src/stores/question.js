import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import generateQuiz from '@/utils/quizGenerator'

function getType(question) {
  if (!question.option || question.option.length === 0) return '填空'
  if (question.option.length === 2) return '判断'
  if (question.answer.length > 1) return '多选'
  return '单选'
}

function isExists(list, question) {
  return list.some(item => item.id === question.id)
}

function updateUserRecord(userRecords, questionId, isCorrect) {
  if (!userRecords[questionId]) {
    userRecords[questionId] = {
      questionId,
      errorCount: 0,
      attempted: 0,
      lastErrorDate: null
    }
  }
  const record = userRecords[questionId]
  record.attempted += 1
  if (!isCorrect) {
    record.errorCount += 1
    record.lastErrorDate = new Date().toISOString().split('T')[0]
  }
}

export const useQuestionStore = defineStore('question', () => {
  // State
  const wrongQuestions = ref([])
  const answerList = ref([])
  const questionBank = ref([])
  const results = ref([])
  const likeList = ref([])
  const score = ref(null)
  const fonts = ref(null)
  const userRecords = ref({})

  // Getters
  const getQuestionsByType = computed(() => (type) => {
    return questionBank.value.filter(question => {
      if (type === 'singleChoice') return question.option && question.answer.length === 1
      if (type === 'multipleChoice') return question.option.length > 2 && question.answer.length > 1
      if (type === 'trueOrFalse') return question.option && question.option.length === 2
      if (type === 'fillInTheBlank') return !question.option
    })
  })

  const getAllQuestions = computed(() => questionBank.value)

  // Actions
  function loadQuestionBank(questions) {
    questionBank.value = questions
  }

  function getQuestionType(question) {
    return getType(question)
  }

  function addWrongQuestion(question) {
    question.likeFlag = true
    wrongQuestions.value.push(question)
  }

  function removeWrongQuestion(questionId) {
    wrongQuestions.value = wrongQuestions.value.filter(q => q.id !== questionId)
  }

  function addLikeQuestion(question) {
    question.likeFlag = true
    likeList.value.push(question)
  }

  function removeLikeQuestion(questionId) {
    likeList.value = likeList.value.filter(q => q.id !== questionId)
  }

  function clearLikeList() {
    likeList.value = []
  }

  function clearWrongQuestions() {
    wrongQuestions.value = []
  }

  async function checkAnswer(autoSave = true) {
    results.value = []
    score.value = null

    const questions = questionBank.value

    await Promise.all(
      questions.map(async (question, index) => {
        const userAnswer = answerList.value[index]
        let isCorrect = false

        switch (getType(question)) {
          case '单选':
          case '判断':
            isCorrect = userAnswer === question.answer
            break
          case '多选': {
            const correctAnswers = question.answer.split('').map(a => a.trim())
            isCorrect = Array.isArray(userAnswer) &&
              userAnswer.length === correctAnswers.length &&
              correctAnswers.every(a => userAnswer.includes(a))
            break
          }
          case '填空':
            isCorrect = userAnswer === question.answer
            break
        }

        updateUserRecord(userRecords.value, question.id, isCorrect)

        results.value.push({ questionId: question.id, isCorrect })

        if (!isCorrect && autoSave) {
          if (!isExists(wrongQuestions.value, question)) {
            question.likeFlag = true
            wrongQuestions.value.push(question)
          }
        }
      })
    )

    score.value = results.value.filter(r => r.isCorrect).length
    answerList.value = []
  }

  async function generateQuizAction(payload) {
    const [lesson, options] = payload
    questionBank.value = []
    const quiz = await generateQuiz(lesson, options)
    questionBank.value = quiz
  }

  // Aliases for backward compat (addFavoriteQuestion was mapped to ADD_WRONG_QUESTION)
  function addFavoriteQuestion(question) { addWrongQuestion(question) }
  function removeFavoriteQuestion(questionId) { removeWrongQuestion(questionId) }

  return {
    wrongQuestions, answerList, questionBank, results,
    likeList, score, fonts, userRecords,
    getQuestionsByType, getAllQuestions,
    loadQuestionBank, getQuestionType,
    addWrongQuestion, removeWrongQuestion,
    addLikeQuestion, removeLikeQuestion,
    addFavoriteQuestion, removeFavoriteQuestion,
    clearLikeList, clearWrongQuestions,
    checkAnswer, generateQuizAction
  }
}, {
  persist: {
    pick: ['wrongQuestions', 'likeList', 'userRecords']
  }
})
