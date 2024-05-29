import Vue from 'vue'
import Vuex from 'vuex'
import createPersistedState from 'vuex-persistedstate'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    wrongQuestions: []
  },
  getters: {
  },
  mutations: {
    ADD_WRONG_QUESTION(state, question) {
      state.wrongQuestions.push(question);
    },
    REMOVE_FAVORITE_QUESTION(state, questionId) {
      state.favoriteQuestions = state.favoriteQuestions.filter(q => q.id !== questionId);
    },
  },
  actions: {
    addFavoriteQuestion({ commit }, question) {
      commit('ADD_FAVORITE_QUESTION', question);
    },
    removeFavoriteQuestion({ commit }, questionId) {
      commit('REMOVE_FAVORITE_QUESTION', questionId);
    }
  },
  modules: {
  },
  plugins: [createPersistedState()]
})
