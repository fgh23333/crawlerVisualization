import Vue from 'vue'
import Vuex from 'vuex'
import createPersistedState from 'vuex-persistedstate'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    wrongQuestions: [],
    answerList: []
  },
  getters: {
  },
  mutations: {
    addAnswer(state, questionIndex, option) {
      state.answerList[questionIndex] = option
      console.log(state.answerList);

    },
    addMultipleAnswer(questionIndex, option) {

    },
    checkAnswer() {

    },
    ADD_WRONG_QUESTION(state, question) {
      state.wrongQuestions.push(question);
    },
    REMOVE_WRONG_QUESTION(state, questionId) {
      state.wrongQuestions = state.wrongQuestions.filter(q => q.id !== questionId);
    },
  },
  actions: {
    addFavoriteQuestion({ commit }, question) {
      commit('ADD_WRONG_QUESTION', question)
    },
    removeFavoriteQuestion({ commit }, questionId) {
      commit('REMOVE_WRONG_QUESTION', questionId);
    },
    addToAnswerList({ commit }, questionIndex, option) {
      commit('addAnswer', questionIndex, option)
    }
  },
  modules: {
  },
  plugins: [createPersistedState()]
})
