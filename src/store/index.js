import Vue from 'vue'
import Vuex from 'vuex'
import createPersistedState from 'vuex-persistedstate'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    wrongQuestions: [],
    answerList: [],
    questionBank: []
  },
  getters: {
    getQuestionsByType: (state) => (type) => {
      return state.questionBank.filter(question => {
        if (type === 'singleChoice') {
          return question.option && question.answer.length === 1;
        }
        if (type === 'multipleChoice') {
          return question.option.length > 2 && question.answer.length > 1;
        }
        if (type === 'trueOrFalse') {
          return question.option && question.option.length === 2;
        }
        if (type === 'fillInTheBlank') {
          return !question.option;
        }
      });
    },
    getAllQuestions: (state) => {
      return state.questionBank;
    }
  },
  mutations: {
    checkAnswer(state) {
      function arraysHaveSameElements(answer, selection) {
        answer = answer.split('')
        if (answer.length !== selection.length) {
          return false;
        }
        return answer.every(element => selection.includes(element));
      }
    },
    setQuestionBank(state, questions) {
      state.questionBank = questions;
    },
    async compareAnswers() {
      const questions = this.$store.state.questionBank;
      const userAnswers = this.$store.state.answerList;

      const results = await Promise.all(
        questions.map((question, index) => {
          const userAnswer = userAnswers[index] // 获取用户的答案
          const correctAnswer = question.answer // 获取当前题目的正确答案
          const questionType = this.getQuestionType(question) // 获取题目类型
          return this.checkAnswer(userAnswer, correctAnswer, questionType)
        })
      )
      return results
    },
    checkAnswer(userAnswer, correctAnswer, questionType) {
      return new Promise((resolve) => {
        if (questionType === '多选') {
          const isCorrect =
            Array.isArray(userAnswer) &&
            userAnswer.length === correctAnswer.length &&
            userAnswer.every((answer) => correctAnswer.includes(answer));
          resolve(isCorrect);
        } else if (questionType === '单选' || questionType === '判断') {
          resolve(userAnswer === correctAnswer);
        } else if (questionType === '填空') {
          resolve(userAnswer.trim() === correctAnswer.trim());
        }
      });
    },
    getQuestionType(question) {
      if (!question.option || question.option.length === 0) {
        return '填空';
      } else if (question.option.length === 2) {
        return '判断';
      } else if (question.answer.length > 1) {
        return '多选';
      } else {
        return '单选';
      }
    },
    ADD_WRONG_QUESTION(state, question) {
      state.wrongQuestions.push(question);
    },
    REMOVE_WRONG_QUESTION(state, questionId) {
      state.wrongQuestions = state.wrongQuestions.filter(q => q.id !== questionId);
    }
  },
  actions: {
    loadQuestionBank({ commit }, questionBank) {
      commit('setQuestionBank', questionBank);
    },
    addFavoriteQuestion({ commit }, question) {
      commit('ADD_WRONG_QUESTION', question)
    },
    removeFavoriteQuestion({ commit }, questionId) {
      commit('REMOVE_WRONG_QUESTION', questionId);
    },
    checkAnswer({ commit }) {
      commit('checkAnswer')
    }
  },
  modules: {
  },
  plugins: [
    createPersistedState({
      paths: ['wrongQuestions']
    })
  ]
})
