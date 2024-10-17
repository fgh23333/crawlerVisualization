import Vue from 'vue'
import Vuex from 'vuex'
import createPersistedState from 'vuex-persistedstate'

Vue.use(Vuex)

function getType(question) {
  if (!question.option || question.option.length === 0) {
    return '填空';
  } else if (question.option.length === 2) {
    return '判断';
  } else if (question.answer.length > 1) {
    return '多选';
  } else {
    return '单选';
  }
}
export default new Vuex.Store({
  state: {
    wrongQuestions: [],
    answerList: [],
    questionBank: [],
    results: []
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
    setQuestionBank(state, questions) {
      state.questionBank = questions;
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
    evaluateAnswers(state) {
      // 清空上次的评估结果
      state.results = [];

      // 假设只评估第一个试卷
      const questions = state.questionBank;

      questions.forEach((question, index) => {
        const userAnswer = state.answerList[index]; // 获取用户答案
        let isCorrect = false;

        switch (getType(question)) {
          case '单选':
          case '判断':
            // 单选题和判断题直接比较
            isCorrect = userAnswer === question.answer;
            break;
          case '多选':
            // 多选题：将标准答案切割成数组并比较
            const correctAnswers = question.answer.split(',').map(answer => answer.trim());
            isCorrect = Array.isArray(userAnswer) &&
              userAnswer.length === correctAnswers.length &&
              correctAnswers.every(answer => userAnswer.includes(answer));
            break;
          case '填空':
            // 填空题：全字匹配
            isCorrect = userAnswer === question.answer;
            break;
        }

        state.results.push({
          questionId: question.id,
          isCorrect
        });

        if (!isCorrect) {
          state.wrongQuestions.push(question);
        }
      });
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
      commit('evaluateAnswers')
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
