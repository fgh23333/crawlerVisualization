import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useNcre3Store = defineStore('ncre3', () => {
  const likeList = ref([])
  const wrongList = ref([])
  const currentCategory = ref('')
  const questionBank = ref([])

  const allFavorites = computed(() => {
    const map = new Map()
    for (const q of [...likeList.value, ...wrongList.value]) {
      map.set(q.id, q)
    }
    return [...map.values()]
  })

  function loadQuestions(questions) {
    questionBank.value = questions
  }

  function addLike(question) {
    if (!likeList.value.some(q => q.id === question.id)) {
      likeList.value.push({ ...question, likeFlag: true })
    }
  }

  function removeLike(questionId) {
    likeList.value = likeList.value.filter(q => q.id !== questionId)
  }

  function isLiked(questionId) {
    return likeList.value.some(q => q.id === questionId)
  }

  function addWrong(question) {
    if (!wrongList.value.some(q => q.id === question.id)) {
      wrongList.value.push({ ...question, markFlag: true })
    }
  }

  function removeWrong(questionId) {
    wrongList.value = wrongList.value.filter(q => q.id !== questionId)
  }

  function isWrong(questionId) {
    return wrongList.value.some(q => q.id === questionId)
  }

  function clearLikeList() {
    likeList.value = []
  }

  function clearWrongList() {
    wrongList.value = []
  }

  return {
    likeList, wrongList, currentCategory, questionBank, allFavorites,
    loadQuestions, addLike, removeLike, isLiked,
    addWrong, removeWrong, isWrong,
    clearLikeList, clearWrongList
  }
}, {
  persist: {
    pick: ['likeList', 'wrongList']
  }
})
