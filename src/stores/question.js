import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import generateQuiz from '@/utils/quizGenerator'

function getType(question) {
  if (!question.option || question.option.length === 0) return '填空'
  if (question.option.length === 2) return '判断'
  if (question.answer.length > 1) return '多选'
  return '单选'
}

function upsertQuestion(listRef, question, flags = {}) {
  // strip ephemeral UI flags before persisting
  const { likeFlag, markFlag, ...cleanQuestion } = question
  const nextQuestion = { ...cleanQuestion, ...flags }
  const index = listRef.value.findIndex(item => item.id === question.id)

  if (index === -1) {
    listRef.value.push(nextQuestion)
    return
  }

  listRef.value[index] = {
    ...listRef.value[index],
    ...nextQuestion
  }
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
  const markList = ref([])
  const score = ref(null)
  const fonts = ref(null)
  const userRecords = ref({})

  // Data Migration: ensure stored lists are arrays of objects, not just IDs
  function migrateLists() {
    const lists = { wrongQuestions, likeList }
    for (const [name, refValue] of Object.entries(lists)) {
      if (Array.isArray(refValue.value) && refValue.value.length > 0) {
        if (typeof refValue.value[0] === 'string' || typeof refValue.value[0] === 'number') {
          console.log(`Migrating ${name} from IDs to Objects...`)
          refValue.value = refValue.value.map(id => ({ id }))
        }
      }
    }
  }

  // Run migration immediately on store initialization
  migrateLists()

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
    upsertQuestion(wrongQuestions, question)
  }

  function removeWrongQuestion(questionId) {
    wrongQuestions.value = wrongQuestions.value.filter(q => q.id !== questionId)
  }

  function addLikeQuestion(question) {
    upsertQuestion(likeList, question)
  }

  function removeLikeQuestion(questionId) {
    likeList.value = likeList.value.filter(q => q.id !== questionId)
  }

  function isFavorite(questionId) {
    return likeList.value.some(q => q.id === questionId)
  }

  function toggleFavorite(question) {
    if (isFavorite(question.id)) {
      removeLikeQuestion(question.id)
      return false
    }
    addLikeQuestion(question)
    return true
  }

  function addMarkQuestion(question) {
    upsertQuestion(markList, question)
  }

  function removeMarkQuestion(questionId) {
    markList.value = markList.value.filter(q => q.id !== questionId)
  }

  function isMarked(questionId) {
    return markList.value.some(q => q.id === questionId)
  }

  function toggleMark(question) {
    if (isMarked(question.id)) {
      removeMarkQuestion(question.id)
      return false
    }
    addMarkQuestion(question)
    return true
  }

  function clearMarkList() {
    markList.value = []
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
          addWrongQuestion(question)
        }
      })
    )

    score.value = results.value.filter(r => r.isCorrect).length
  }

  async function generateQuizAction(payload) {
    const [lesson, options] = payload
    questionBank.value = []
    const quiz = await generateQuiz(lesson, options)
    questionBank.value = quiz
  }

  // Aliases retained for backward compat with examPage.vue.
  // NOTE: original aliases incorrectly mapped favorite-add to wrong-question-add.
  // Now these correctly hit the favorites/like list.
  function addFavoriteQuestion(question) { addLikeQuestion(question) }
  function removeFavoriteQuestion(questionId) { removeLikeQuestion(questionId) }

  return {
    wrongQuestions, answerList, questionBank, results,
    likeList, markList, score, fonts, userRecords,
    getQuestionsByType, getAllQuestions,
    loadQuestionBank, getQuestionType,
    addWrongQuestion, removeWrongQuestion,
    addLikeQuestion, removeLikeQuestion,
    isFavorite, toggleFavorite,
    addMarkQuestion, removeMarkQuestion,
    isMarked, toggleMark, clearMarkList,
    addFavoriteQuestion, removeFavoriteQuestion,
    clearLikeList, clearWrongQuestions,
    checkAnswer, generateQuizAction
  }
}, {
  persist: {
    pick: ['wrongQuestions', 'likeList', 'markList', 'userRecords']
  }
})
