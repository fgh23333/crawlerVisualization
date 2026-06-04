import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useComputerQuestionStore = defineStore('computerQuestion', () => {
  const favorites = ref([]) // 存储收藏的题目对象（完整数据）

  function isFavorite(id) {
    return favorites.value.some(q => q.id === id)
  }

  function toggleFavorite(question) {
    if (isFavorite(question.id)) {
      favorites.value = favorites.value.filter(q => q.id !== question.id)
      return false
    }
    favorites.value.push(question)
    return true
  }

  function clearFavorites() {
    favorites.value = []
  }

  return { favorites, isFavorite, toggleFavorite, clearFavorites }
}, {
  persist: {
    pick: ['favorites']
  }
})
