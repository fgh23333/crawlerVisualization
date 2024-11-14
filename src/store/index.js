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

function isExists(list, question) {
  return list.some(favorite => favorite.id === question.id);
}

export default new Vuex.Store({
  state: {
    wrongQuestions: [],
    answerList: [],
    questionBank: [],
    results: [],
    likeList: [],
    score: null,
    fonts: null
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
      question.likeFlag = true
      state.wrongQuestions.push(question);
    },
    REMOVE_WRONG_QUESTION(state, questionId) {
      state.wrongQuestions = state.wrongQuestions.filter(q => q.id !== questionId);
    },
    ADD_LIKE_QUESTION(state, question) {
      question.likeFlag = true
      state.likeList.push(question);
    },
    REMOVE_LIKE_QUESTION(state, questionId) {
      state.likeList = state.likeList.filter(q => q.id !== questionId);
    },
    async evaluateAnswers(state) {
      // 清空上次的评估结果
      state.results = [];
      state.score = null

      // 假设只评估第一个试卷
      const questions = state.questionBank;

      // 并行处理每道题目的评估
      await Promise.all(
        questions.map(async (question, index) => {
          const userAnswer = state.answerList[index];
          let isCorrect = false;

          switch (getType(question)) {
            case '单选':
            case '判断':
              // 单选题和判断题直接比较
              isCorrect = userAnswer === question.answer;
              break;
            case '多选':
              // 多选题：将标准答案切割成数组并比较
              const correctAnswers = question.answer.split('').map(answer => answer.trim());
              isCorrect = Array.isArray(userAnswer) &&
                userAnswer.length === correctAnswers.length &&
                correctAnswers.every(answer => userAnswer.includes(answer));
              break;
            case '填空':
              // 填空题：全字匹配
              isCorrect = userAnswer === question.answer;
              break;
          }

          // 保存结果到 results 数组
          state.results.push({
            questionId: question.id,
            isCorrect
          });

          // 处理错误题目
          if (!isCorrect) {
            if (isExists(state.wrongQuestions, question)) {
              return
            } else {
              question.likeFlag = true;
              state.wrongQuestions.push(question);
            }
          }
        })
      );

      // 计算得分，累加所有正确题目的数量
      state.score = state.results.filter(result => result.isCorrect).length;
      state.answerList = [];
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
    addLikeQuestion({ commit }, question) {
      commit('ADD_LIKE_QUESTION', question)
    },
    removeLikeQuestion({ commit }, questionId) {
      commit('REMOVE_LIKE_QUESTION', questionId);
    },
    checkAnswer({ commit }) {
      commit('evaluateAnswers')
    }
  },
  modules: {
  },
  plugins: [
    createPersistedState({
      paths: ['wrongQuestions', 'likeList']
    })
  ]
})
