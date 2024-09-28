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
    addAnswer(state, payload) {
      state.answerList[payload.questionIndex] = payload.option
      console.log(state.answerList);
    },
    checkAnswer(state) {
      function arraysHaveSameElements(answer, selection) {
        answer = answer.split('')
        if (answer.length !== selection.length) {
          return false;
        }
        return answer.every(element => selection.includes(element));
      }
    },
    async compareAnswers() {
      const questions = this.$store.state.questions; // 从 store 获取题目列表
      const userAnswers = this.$store.state.answerList; // 从 store 获取用户的答案

      // 使用 Promise.all 并行比对所有题目
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
          // 多选题：判断用户答案和正确答案是否相同
          const isCorrect =
            Array.isArray(userAnswer) &&
            userAnswer.length === correctAnswer.length &&
            userAnswer.every((answer) => correctAnswer.includes(answer));
          resolve(isCorrect);
        } else if (questionType === '单选' || questionType === '判断') {
          // 单选题或判断题：直接比对用户答案和正确答案
          resolve(userAnswer === correctAnswer);
        } else if (questionType === '填空') {
          // 填空题：将用户输入的答案和正确答案进行字符串比对
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
    },
  },
  actions: {
    addFavoriteQuestion({ commit }, question) {
      commit('ADD_WRONG_QUESTION', question)
    },
    removeFavoriteQuestion({ commit }, questionId) {
      commit('REMOVE_WRONG_QUESTION', questionId);
    },
    addToAnswerList({ commit }, { questionIndex, option }) {
      commit('addAnswer', { questionIndex, option })
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
