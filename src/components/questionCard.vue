<template>
  <div id="questionCard">
    <div v-if="list == ''">暂无数据</div>
    <div v-else>
      <div class="header">
        <div class="breadCrumb" v-if="subjectShow.includes(lesson) && !onSearch">
          {{ subjectList[lesson] }} - {{ questionType[type] }} - 共{{ list.length }}题
        </div>
        <div class="breadCrumb" v-if="subjectShow.includes(lesson) && onSearch">
          {{ subjectList[lesson] }} - {{ questionType[type] }} - 搜索结果共{{ showList.length }}题
        </div>
        <div class="breadCrumb" v-if="!lesson && !onSearch">
          <span class="count">共{{ showList.length }}题</span>
          <span class="subjectSelector">
            <el-select v-model="subjectFocus" collapse-tags multiple placeholder="请选择">
              <el-option v-for="(subjectOpt, i) in subjectOpts" :key="i" :label="subjectOpt.label"
                :value="subjectOpt.value">
              </el-option>
            </el-select>
          </span>
        </div>
        <div class="breadCrumb" v-if="!lesson && onSearch">
          搜索结果共{{ showList.length }}题
        </div>
        <div class="rightplace">
          <!--          练习模式开关-->
          <el-switch v-model="practiceMode" active-text="练习" inactive-text="" active-color="#6C5DD3"
            class="practice-switch">
          </el-switch>
          <!--          搜索框-->
          <el-input class="input" placeholder="搜题（回车以搜索）" v-model="searchWord" @change="search" @input="changeInput"
            clearable>
          </el-input>
          <!--          更多功能-下拉菜单-导出pdf-->
          <el-dropdown placement="bottom" class="dropdown" @command="handleCommand">
            <el-button icon="el-icon-s-operation" type="text" size="medium">工具</el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="savePDF">导出PDF</el-dropdown-item>
                <el-dropdown-item command="savePDFNoAnswer">导出PDF（无答案）</el-dropdown-item>
                <el-dropdown-item command="printPDF">打印题库</el-dropdown-item>
                <el-dropdown-item command="updateDefaultSetting">{{ defaultShowAnswer ? '隐藏答案' : '显示答案'
                  }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
      <div v-if="showList == '' && onSearch">
        <el-empty description="搜索结果为空"></el-empty>
      </div>
      <div class="questionCover" v-for="(item, i) in showList" :key="i">
        <!-- 判断题 -->
        <div class="typeCover" v-if="showList[i].option.length == 2">
          <div class="questionTypeCover">
            <div class="left">
              <span class="seq">{{ i + 1 }}</span>
            </div>
            <div class="right">
              <div class="markAndLike">
                <button class="fav-btn mark-btn" :class="{ 'is-fav': isMarked(showList[i]) }"
                  @click="toggleMark(showList[i])" type="button">
                  <svg class="fav-icon" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                    <path d="M7 3h10a1 1 0 0 1 1 1v17l-6-3.5L6 21V4a1 1 0 0 1 1-1z"
                      :fill="isMarked(showList[i]) ? 'currentColor' : 'none'"
                      stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                  </svg>
                  <span class="fav-text">{{ isMarked(showList[i]) ? '已标记' : '标记' }}</span>
                </button>
                <button class="fav-btn" :class="{ 'is-fav': isFav(showList[i]) }"
                  @click="toggleFav(showList[i], i)" type="button">
                  <svg class="fav-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                    <path d="M12 2.5l2.95 6.36 6.55.66-4.9 4.79 1.39 6.69L12 17.77l-6 3.23 1.39-6.69L2.5 9.52l6.55-.66L12 2.5z"
                      :fill="isFav(showList[i]) ? 'currentColor' : 'none'"
                      stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                  </svg>
                  <span class="fav-text">{{ isFav(showList[i]) ? '已收藏' : '收藏' }}</span>
                </button>
              </div>
              <div class="questionType">
                <span v-if="$route.path == '/newHome/favorites'">
                  {{ abbreviationSubjectList[showList[i].abbreviationSubject] }} -
                </span>
                <span>判断</span>
              </div>
              <div class="questionStem">{{ showList[i].questionStem }}</div>
              <!-- 练习模式：判断题选择 -->
              <div class="practice-area" v-if="practiceMode && !practiceResults[i]">
                <el-radio-group v-model="practiceAnswers[i]" @change="val => submitPractice(i, val)">
                  <el-radio v-for="(opt, k) in showList[i].option" :key="k" :label="opt">{{ opt }}</el-radio>
                </el-radio-group>
              </div>
              <!-- 练习结果 -->
              <div class="practice-result" v-if="practiceMode && practiceResults[i]">
                <span class="result-tag" :class="practiceResults[i].isCorrect ? 'result-true' : 'result-false'">
                  {{ practiceResults[i].isCorrect ? '回答正确' : '回答错误' }}
                </span>
                <span class="your-answer">你的答案：{{ practiceResults[i].userAnswer }}</span>
                <span class="correctAnswer" v-if="!practiceResults[i].isCorrect">正确答案：{{ showList[i].answer }}</span>
              </div>
              <!-- 普通模式答案 -->
              <div class="questionAnswer" v-if="!practiceMode">
                <span class="colorBefore"></span>
                <span class="correctAnswer">正确答案：</span>
                <span class="true" @click="toggleAnswer(i)" v-if="showList[i].answer == '正确'">{{ showAnswers[i] ?
                  showList[i].answer : '' }}</span>
                <span class="false" @click="toggleAnswer(i)" v-if="showList[i].answer == '错误'">{{ showAnswers[i] ?
                  showList[i].answer : '' }}</span>
                <span class="answer" @click="toggleAnswer(i)" v-if="!showAnswers[i]">点击显示答案</span>
              </div>
            </div>
          </div>
        </div>
        <!-- 填空题 -->
        <div class="typeCover" v-if="showList[i].option == ''">
          <div class="questionTypeCover">
            <div class="left">
              <span class="seq">{{ i + 1 }}</span>
            </div>
            <div class="right">
              <div class="markAndLike">
                <button class="fav-btn mark-btn" :class="{ 'is-fav': isMarked(showList[i]) }"
                  @click="toggleMark(showList[i])" type="button">
                  <svg class="fav-icon" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                    <path d="M7 3h10a1 1 0 0 1 1 1v17l-6-3.5L6 21V4a1 1 0 0 1 1-1z"
                      :fill="isMarked(showList[i]) ? 'currentColor' : 'none'"
                      stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                  </svg>
                  <span class="fav-text">{{ isMarked(showList[i]) ? '已标记' : '标记' }}</span>
                </button>
                <button class="fav-btn" :class="{ 'is-fav': isFav(showList[i]) }"
                  @click="toggleFav(showList[i], i)" type="button">
                  <svg class="fav-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                    <path d="M12 2.5l2.95 6.36 6.55.66-4.9 4.79 1.39 6.69L12 17.77l-6 3.23 1.39-6.69L2.5 9.52l6.55-.66L12 2.5z"
                      :fill="isFav(showList[i]) ? 'currentColor' : 'none'"
                      stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                  </svg>
                  <span class="fav-text">{{ isFav(showList[i]) ? '已收藏' : '收藏' }}</span>
                </button>
              </div>
              <div class="questionType">
                <span v-if="$route.path == '/newHome/favorites'">
                  {{ abbreviationSubjectList[showList[i].abbreviationSubject] }} -
                </span>
                <span>填空</span>
              </div>
              <div class="questionStem">{{ showList[i].questionStem }}</div>
              <!-- 练习模式：填空题输入 -->
              <div class="practice-area" v-if="practiceMode && !practiceResults[i]">
                <div class="fill-practice-row">
                  <el-input v-model="practiceAnswers[i]" placeholder="请输入答案" class="fill-input"
                    @keyup.enter.native="submitPractice(i, practiceAnswers[i])"></el-input>
                  <el-button type="primary" size="small" @click="submitPractice(i, practiceAnswers[i])"
                    class="fill-submit">提交</el-button>
                </div>
              </div>
              <!-- 练习结果 -->
              <div class="practice-result" v-if="practiceMode && practiceResults[i]">
                <span class="result-tag" :class="practiceResults[i].isCorrect ? 'result-true' : 'result-false'">
                  {{ practiceResults[i].isCorrect ? '回答正确' : '回答错误' }}
                </span>
                <span class="your-answer">你的答案：{{ practiceResults[i].userAnswer }}</span>
                <span class="correctAnswer" v-if="!practiceResults[i].isCorrect">正确答案：{{ showList[i].answer }}</span>
              </div>
              <!-- 普通模式答案 -->
              <div class="questionAnswer" v-if="!practiceMode">
                <span class="colorBefore"></span>
                <span class="correctAnswer">正确答案：</span>
                <span class="answer" @click="toggleAnswer(i)">{{ showAnswers[i] ? showList[i].answer : '点击显示答案'
                  }}</span>
              </div>
            </div>
          </div>
        </div>
        <!-- 单选题 -->
        <div class="typeCover" v-if="showList[i].option.length == 4 && showList[i].answer.length == 1">
          <div class="questionTypeCover">
            <div class="left">
              <span class="seq">{{ i + 1 }}</span>
            </div>
            <div class="right">
              <div class="markAndLike">
                <button class="fav-btn mark-btn" :class="{ 'is-fav': isMarked(showList[i]) }"
                  @click="toggleMark(showList[i])" type="button">
                  <svg class="fav-icon" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                    <path d="M7 3h10a1 1 0 0 1 1 1v17l-6-3.5L6 21V4a1 1 0 0 1 1-1z"
                      :fill="isMarked(showList[i]) ? 'currentColor' : 'none'"
                      stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                  </svg>
                  <span class="fav-text">{{ isMarked(showList[i]) ? '已标记' : '标记' }}</span>
                </button>
                <button class="fav-btn" :class="{ 'is-fav': isFav(showList[i]) }"
                  @click="toggleFav(showList[i], i)" type="button">
                  <svg class="fav-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                    <path d="M12 2.5l2.95 6.36 6.55.66-4.9 4.79 1.39 6.69L12 17.77l-6 3.23 1.39-6.69L2.5 9.52l6.55-.66L12 2.5z"
                      :fill="isFav(showList[i]) ? 'currentColor' : 'none'"
                      stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                  </svg>
                  <span class="fav-text">{{ isFav(showList[i]) ? '已收藏' : '收藏' }}</span>
                </button>
              </div>
              <div class="questionType">
                <span v-if="$route.path == '/newHome/favorites'">
                  {{ abbreviationSubjectList[showList[i].abbreviationSubject] }} -
                </span>
                <span>单选</span>
              </div>
              <div class="questionStem">{{ showList[i].questionStem }}</div>
              <!-- 练习模式：单选题选择 -->
              <div class="practice-area" v-if="practiceMode">
                <el-radio-group v-model="practiceAnswers[i]" @change="val => submitPractice(i, val)"
                  :disabled="!!practiceResults[i]">
                  <div v-for="(opt, k) in showList[i].option" :key="k" class="practice-option">
                    <el-radio :label="options[k]">{{ options[k] }}、{{ opt }}</el-radio>
                  </div>
                </el-radio-group>
              </div>
              <!-- 普通模式选项 -->
              <div class="questionOpt" v-if="!practiceMode">
                <div class="option" v-for="(item, k) in showList[i].option" :key="k">
                  <div class="dot"></div>
                  <div class="optText">{{ options[k] }}、{{ showList[i].option[k] }}</div>
                </div>
              </div>
              <!-- 练习结果 -->
              <div class="practice-result" v-if="practiceMode && practiceResults[i]">
                <span class="result-tag" :class="practiceResults[i].isCorrect ? 'result-true' : 'result-false'">
                  {{ practiceResults[i].isCorrect ? '回答正确' : '回答错误' }}
                </span>
                <span class="your-answer">你的答案：{{ practiceResults[i].userAnswer }}</span>
                <span class="correctAnswer" v-if="!practiceResults[i].isCorrect">正确答案：{{ showList[i].answer }}</span>
              </div>
              <!-- 普通模式答案 -->
              <div class="questionAnswer" v-if="!practiceMode">
                <span class="colorBefore"></span>
                <span class="correctAnswer">正确答案：</span>
                <span class="answer" @click="toggleAnswer(i)">{{ showAnswers[i] ? showList[i].answer : '点击显示答案'
                  }}</span>
              </div>
            </div>
          </div>
        </div>
        <!-- 多选题 -->
        <div class="typeCover" v-if="showList[i].option.length > 3 && showList[i].answer.length > 1">
          <div class="questionTypeCover">
            <div class="left">
              <span class="seq">{{ i + 1 }}</span>
            </div>
            <div class="right">
              <div class="markAndLike">
                <button class="fav-btn mark-btn" :class="{ 'is-fav': isMarked(showList[i]) }"
                  @click="toggleMark(showList[i])" type="button">
                  <svg class="fav-icon" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                    <path d="M7 3h10a1 1 0 0 1 1 1v17l-6-3.5L6 21V4a1 1 0 0 1 1-1z"
                      :fill="isMarked(showList[i]) ? 'currentColor' : 'none'"
                      stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                  </svg>
                  <span class="fav-text">{{ isMarked(showList[i]) ? '已标记' : '标记' }}</span>
                </button>
                <button class="fav-btn" :class="{ 'is-fav': isFav(showList[i]) }"
                  @click="toggleFav(showList[i], i)" type="button">
                  <svg class="fav-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                    <path d="M12 2.5l2.95 6.36 6.55.66-4.9 4.79 1.39 6.69L12 17.77l-6 3.23 1.39-6.69L2.5 9.52l6.55-.66L12 2.5z"
                      :fill="isFav(showList[i]) ? 'currentColor' : 'none'"
                      stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                  </svg>
                  <span class="fav-text">{{ isFav(showList[i]) ? '已收藏' : '收藏' }}</span>
                </button>
              </div>
              <div class="questionType">
                <span v-if="$route.path == '/newHome/favorites'">
                  {{ abbreviationSubjectList[showList[i].abbreviationSubject] }} -
                </span>
                <span>多选</span>
              </div>
              <div class="questionStem">{{ showList[i].questionStem }}</div>
              <!-- 练习模式：多选题选择 -->
              <div class="practice-area" v-if="practiceMode">
                <el-checkbox-group v-model="practiceAnswers[i]" :disabled="!!practiceResults[i]">
                  <div v-for="(opt, k) in showList[i].option" :key="k" class="practice-option">
                    <el-checkbox :label="options[k]">{{ options[k] }}、{{ opt }}</el-checkbox>
                  </div>
                </el-checkbox-group>
                <el-button v-if="!practiceResults[i]" type="primary" size="small" @click="submitPractice(i, practiceAnswers[i])"
                  :disabled="!practiceAnswers[i] || practiceAnswers[i].length === 0" class="multi-submit">确认提交</el-button>
              </div>
              <!-- 普通模式选项 -->
              <div class="questionOpt" v-if="!practiceMode">
                <div class="option" v-for="(item, k) in showList[i].option" :key="k">
                  <div class="dot"></div>
                  <div class="optText">{{ options[k] }}、{{ showList[i].option[k] }}</div>
                </div>
              </div>
              <!-- 练习结果 -->
              <div class="practice-result" v-if="practiceMode && practiceResults[i]">
                <span class="result-tag" :class="practiceResults[i].isCorrect ? 'result-true' : 'result-false'">
                  {{ practiceResults[i].isCorrect ? '回答正确' : '回答错误' }}
                </span>
                <span class="your-answer">你的答案：{{ practiceResults[i].userAnswer }}</span>
                <span class="correctAnswer" v-if="!practiceResults[i].isCorrect">正确答案：{{ showList[i].answer }}</span>
              </div>
              <!-- 普通模式答案 -->
              <div class="questionAnswer" v-if="!practiceMode">
                <span class="colorBefore"></span>
                <span class="correctAnswer">正确答案：</span>
                <span class="answer" @click="toggleAnswer(i)">{{ showAnswers[i] ? showList[i].answer : '点击显示答案'
                  }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="bottomAlert" v-if="showList.length !== 0">--- 已经到底啦 ---</div>
    </div>
  </div>
</template>

<script>
import { useQuestionStore } from '@/stores/question'
import { loadQuestionBank } from '@/utils/loadJson'
import Fuse from 'fuse.js';
import { makePdf } from "@/utils/makePdf";
import { ElMessage } from 'element-plus'

export default {
  setup() {
    return { store: useQuestionStore() }
  },
  data() {
    return {
      showAnswers: [],
      defaultShowAnswer: false,
      subjectFocus: [],
      searchWord: "",  //搜索框内容
      list: [], //这个是此题库所有的题目列表
      showList: [],  //这个是渲染在页面上的题目列表
      onSearch: false,  //值为true表示显示搜索结果
      options: ['A', 'B', 'C', 'D', 'E'],
      practiceMode: false,
      practiceAnswers: {},  // { index: answer }
      practiceResults: {},  // { index: { isCorrect, userAnswer } }
      subjectOpts: [
        {
          value: 'Marx',
          label: '马原',
        },
        {
          value: 'CMH',
          label: '近代史'
        },
        {
          value: 'Political',
          label: '思政'
        },
        {
          value: 'MaoIntro',
          label: '毛概'
        },
        {
          value: 'XiIntro',
          label: '习概'
        },
        {
          value: 'SDH',
          label: '社主史'
        },
        {
          value: 'NCH',
          label: '新中国史'
        },
        {
          value: 'CCPH',
          label: '党史'
        },
        {
          value: 'ORH',
          label: '改开史'
        },
      ],
      subjectList: {
        'Marx': '马克思主义基本原理',
        'XiIntro': '习近平新时代中国特色社会主义思想概论',
        'CMH': '中国近现代史纲要',
        'Political': '思想道德与法治',
        'MaoIntro': '毛泽东思想和中国特色社会主义理论体系概论',
        'CCPH': '中国共产党历史',
        'ORH': '改革开放史',
        'SDH': '社会主义发展史',
        'NCH': '新中国史'
      },
      questionType: {
        'subject': '总题库',
        'rightWrong': '判断题',
        'singleChoice': '单选题',
        'multipleChoice': '多选题',
        'fillingBlank': '填空题'
      },
      lesson: '',
      type: '',
      subjectShow: ['Marx', 'XiIntro', 'CMH', 'Political', 'MaoIntro', 'CCPH', 'ORH', 'SDH', 'NCH'],
      abbreviationSubjectList: {
        'Marx': '马原',
        'CMH': '近代史',
        'Political': '思政',
        'MaoIntro': '毛概',
        'XiIntro': '习概',
        'SDH': '社主史',
        'NCH': '新中国史',
        'CCPH': '党史',
        'ORH': '改开史'
      }
    }
  },
  props: {
    subjectOptions: {
      type: String,
      default: ''
    },
    favList: {
      type: Array,
      default: () => {
        return []
      }
    },
    selectedTypes: {
      type: Array,
      default: () => {
        return []
      }
    }
  },
  mounted() {
    const savedDefault = localStorage.getItem("defaultShowAnswer");
    if (savedDefault !== null) {
      this.defaultShowAnswer = JSON.parse(savedDefault);
    } else {
      localStorage.setItem("defaultShowAnswer", JSON.stringify(this.defaultShowAnswer));
    }
    // 初始化所有题目的显示状态
    this.initShowAnswers();
  },
  async created() {
    this.lesson = this.$route.params.lesson;
    this.type = this.$route.params.type;
    if (this.$route.path == "/newHome/favorites") {
      this.list = this.favList
    } else {
      try {
        this.list = await loadQuestionBank(this.lesson, this.type);
      } catch (e) {
        this.list = [];
      }
    }
    this.showList = [...this.list]
    this.searchWord = ""
    this.onSearch = false
    this.initShowAnswers();
  },
  watch: {
    subjectOptions: {
      handler(newValue, oldValue) {
        if (this.$route.path == '/newHome/favorites') {
          switch (newValue) {
            case 'all':
              this.list = this.getMergedFavoriteList()
              this.showList = [...this.list]
              break
            case 'favorites':
              this.list = this.store.likeList
              this.showList = [...this.list]
              break
            case 'wrong':
              this.list = this.store.wrongQuestions
              this.showList = [...this.list]
              break
            default:
              return
          }
          this.initShowAnswers();
        }
      }
    },
    favList: {
      handler(newValue) {
        if (this.$route.path == "/newHome/favorites") {
          this.showList = newValue
          this.initShowAnswers();
        }
      }
    },
    '$route': async function (to, from) {
      this.lesson = to.params.lesson;
      this.type = to.params.type;
      if (this.$route.path == "/newHome/favorites") {
        return
      } else {
        try {
            this.list = await loadQuestionBank(this.lesson, this.type);
        } catch (e) {
            this.list = [];
        }
      }
      this.showList = [...this.list]
      this.searchWord = ""
      this.onSearch = false
      this.practiceAnswers = {}
      this.practiceResults = {}
      this.initShowAnswers();
    },
    // 监听题型筛选
    selectedTypes: {
      handler(newValue) {
        if (Array.isArray(newValue)) {
          this.updateShowList();
        }
      },
      deep: true,
    },
    // 监听科目筛选
    subjectFocus: {
      handler(newValue) {
        if (Array.isArray(newValue)) {
          this.updateShowList();
        }
      },
      deep: true,
    },
    // 监听练习模式切换
    practiceMode(val) {
      this.practiceAnswers = {};
      this.practiceResults = {};
    },
  },
  methods: {
    initShowAnswers() {
      // Try to restore from localStorage
      const storageKey = this.getAnswerStorageKey();
      let saved = {};
      if (storageKey) {
        try {
          saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
        } catch (e) { /* ignore */ }
      }
      // Create a new array to ensure reactivity
      this.showAnswers = this.showList.map((item, idx) => {
        if (saved[item.id]) return true;
        return this.defaultShowAnswer;
      });
    },
    getAnswerStorageKey() {
      if (this.$route.path === '/newHome/favorites') return 'viewed_favorites';
      const lesson = this.$route.params.lesson;
      const type = this.$route.params.type;
      if (lesson && type) return `viewed_${lesson}_${type}`;
      return null;
    },
    saveViewedState() {
      const storageKey = this.getAnswerStorageKey();
      if (!storageKey) return;
      const viewed = {};
      this.showList.forEach((item, idx) => {
        if (this.showAnswers[idx]) viewed[item.id] = true;
      });
      localStorage.setItem(storageKey, JSON.stringify(viewed));
    },
    toggleAnswer(index) {
      const newVal = !this.showAnswers[index];
      this.showAnswers.splice(index, 1, newVal);
      this.saveViewedState();
    },
    updateDefaultSetting() {
      this.defaultShowAnswer = !this.defaultShowAnswer
      localStorage.setItem("defaultShowAnswer", JSON.stringify(this.defaultShowAnswer));
      this.initShowAnswers();
      this.saveViewedState();
    },
    getQuestionType(question) {
      const { option, answer } = question;
      if (!option || option.length === 0) {
        return "fillingBlank"; // 填空题
      } else if (option.length === 2) {
        return "rightWrong"; // 判断题
      } else if (answer.length === 1) {
        return "singleChoice"; // 单选题
      } else if (answer.length > 1) {
        return "multipleChoice"; // 多选题
      }
      return null; // 未知题型
    },
    updateShowList(type, checked) {
      const validSelectedTypes = Array.isArray(this.selectedTypes) ? this.selectedTypes : [];
      const validSelectedSubjects = Array.isArray(this.subjectFocus) ? this.subjectFocus : [];

      // 筛选题目：题型和科目取交集
      const filteredByType = validSelectedTypes.length
        ? this.list.filter((question) => validSelectedTypes.includes(this.getQuestionType(question)))
        : this.list; // 若未选择题型，保留所有题型

      const filteredBySubject = validSelectedSubjects.length
        ? filteredByType.filter((question) => validSelectedSubjects.includes(question.abbreviationSubject))
        : filteredByType; // 若未选择科目，保留所有科目

      this.showList = [...filteredBySubject];
      this.initShowAnswers();
    },
    handleCommand(e) {
      if (e == 'updateDefaultSetting') {
        this.updateDefaultSetting()
      } else {
        let title = "题库";

        if (this.subjectShow.includes(this.lesson) && this.onSearch) {
          title = `${this.subjectList[this.lesson]} - ${this.questionType[this.type]} - '${this.searchWord}'搜索结果共${this.showList.length}题`
        }
        if (this.subjectShow.includes(this.lesson) && !this.onSearch) {
          title = `${this.subjectList[this.lesson]} - ${this.questionType[this.type]} - 共${this.list.length}题`
        }
        if (!this.lesson && this.onSearch) {
          title = `收藏夹 - '${this.searchWord}'搜索结果共${this.showList.length}题`

        }
        if (!this.lesson && !this.onSearch) {
          title = `收藏夹-共${this.list.length}题`
        }
        if (e === "savePDF") {
          makePdf("save", this.showList, title, null, ElMessage);
        }
        if (e === "savePDFNoAnswer") {
          makePdf("save", this.showList, title, null, ElMessage, true);
        }
        if (e === "printPDF") {
          makePdf("print", this.showList, title, null, ElMessage);
        }
      }

    },
    submitPractice(index, userAnswer) {
      const question = this.showList[index];
      const qType = this.getQuestionType(question);
      let isCorrect = false;

      if (qType === 'singleChoice' || qType === 'rightWrong') {
        isCorrect = userAnswer === question.answer;
      } else if (qType === 'multipleChoice') {
        const correctAnswers = question.answer.split('').map(a => a.trim());
        isCorrect = Array.isArray(userAnswer) &&
          userAnswer.length === correctAnswers.length &&
          correctAnswers.every(a => userAnswer.includes(a));
      } else if (qType === 'fillingBlank') {
        isCorrect = userAnswer && userAnswer.trim() === question.answer;
      }

      // 保存结果
      this.practiceResults[index] = {
        isCorrect,
        userAnswer: Array.isArray(userAnswer) ? userAnswer.join('') : (userAnswer || '')
      };

      // 错了自动加入错题集
      if (!isCorrect) {
        this.store.addWrongQuestion(question);
      }
    },
    changeFlag(flagType, i) {
      // Legacy entrypoint — kept in case external code calls it. Delegates to toggleFav.
      this.toggleFav(this.showList[i], i)
    },
    isFav(question) {
      if (!question) return false
      return this.store.isFavorite(question.id)
    },
    isMarked(question) {
      if (!question) return false
      return this.store.isMarked(question.id)
    },
    toggleMark(question) {
      if (!question) return
      const nowMarked = this.store.toggleMark(question)
      ElMessage({
        message: nowMarked ? '已标记' : '已取消标记',
        type: nowMarked ? 'success' : 'info',
        duration: 1200
      })
    },
    toggleFav(question, i) {
      if (!question) return
      const nowFavorite = this.store.toggleFavorite(question)
      ElMessage({
        message: nowFavorite ? '已加入收藏夹' : '已取消收藏',
        type: nowFavorite ? 'success' : 'info',
        duration: 1200
      })
      // If we're viewing the favorites page and the user just un-favorited an item,
      // remove it from the rendered list — but only if it's no longer present in any
      // underlying list (it could still be a wrong question in 'all' mode).
      if (!nowFavorite && this.$route.path === '/newHome/favorites') {
        const stillVisible =
          this.subjectOptions === 'all' &&
          this.store.wrongQuestions.some(q => q.id === question.id)
        if (!stillVisible) {
          this.showList.splice(i, 1)
          this.list = this.list.filter(q => q.id !== question.id)
        }
      }
    },
    getMergedFavoriteList() {
      const unique = new Map();
      [...this.store.likeList, ...this.store.wrongQuestions].forEach(item => {
        unique.set(item.id, item);
      });
      return Array.from(unique.values());
    },
    changeInput() {
      if (this.searchWord === "") {
        this.showList = [...this.list]
        this.onSearch = false
      }
    },
    search() {
      const fuseOptions = {
        keys: ['questionStem']
      };
      const fuse = new Fuse(this.list, fuseOptions);
      let temp = this.searchWord ? fuse.search(this.searchWord).map(result => result.item) : this.list;
      this.showList = [...temp]
      this.onSearch = this.searchWord === "" ? false : true
    }
  }
}
</script>

<style lang="scss">
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

#questionCard {
  .header {
    display: flex;
    justify-content: space-between;
    margin: 10px 34rpx;
    //padding-left: 30px;
    align-items: center;
    height: 68px;

    .rightplace {
      margin-right: 30px;
      width: 35%;
      display: flex;

      .input {
        margin-right: 10px;
      }
    }

    .breadCrumb {
      color: #898799;
      font-size: 18px;
      font-weight: 500;
      text-align: left;
      line-height: 68px;
      font-family: 思源黑体;
      margin-left: 34px;
      height: 68px;

      .subjectSelector {
        margin-left: 20px;

        .el-select {
          line-height: 40px;
          width: 160px;
        }
      }
    }
  }

  .questionCover {
    background-color: #FFFFFF;
    padding: 14px 18px;
    margin: 15px 34px;
    border-radius: 24px;
    box-shadow: 0px -1px 8px 0px rgba(230, 232, 240, 0.9),
      -1px 0px 8px 0px rgba(230, 232, 240, 0.9),
      1px 0px 8px 0px rgba(230, 232, 240, 0.9),
      0px 1px 8px 0px rgba(230, 232, 240, 0.9);

    .questionTypeCover {
      font-family: HarmonyOS Sans SC;
      display: flex;
      justify-content: flex-start;

      .left {
        width: fit-content;
        margin-right: 10px;

        .seq {
          height: 30px;
          font-size: 20px;
          font-weight: bold;
          color: white;
          background-color: #6C5DD3;
          border-radius: 10px;
          padding: 0px 10px;
          line-height: 30px;
          display: inline-block;
        }
      }

      .right {
        text-align: left;
        position: relative;
        width: 94%;

        .markAndLike {
          height: 32px;
          position: absolute;
          top: 0px;
          right: 0px;
          display: flex;
          align-items: center;
          gap: 8px;

          .fav-btn {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            height: 28px;
            padding: 0 10px;
            border-radius: 14px;
            border: 1px solid #6C5DD3;
            background-color: #fff;
            color: #6C5DD3;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            line-height: 1;
            font-family: inherit;

            .fav-icon {
              flex-shrink: 0;
              transition: transform 0.2s ease;
            }

            .fav-text {
              white-space: nowrap;
            }

            &:hover {
              background-color: #E6E4F4;
              transform: translateY(-1px);
              box-shadow: 0 2px 6px rgba(108, 93, 211, 0.25);
            }

            &:active .fav-icon {
              transform: scale(1.2);
            }

            &.is-fav {
              background-color: #6C5DD3;
              color: #fff;
              border-color: #6C5DD3;

              .fav-icon {
                // Drop shadow gives the star a faint outline so the filled
                // glyph stays visible even though fill === button background.
                filter: drop-shadow(0 0 0.5px rgba(0, 0, 0, 0.35));
              }

              &:hover {
                background-color: #5B4FB5;
                border-color: #5B4FB5;
              }
            }
          }
        }

        .questionType {
          letter-spacing: 3px;
          height: 30px;
          line-height: 30px;
          font-size: 18px;
          font-weight: bold;
          color: #877BD1;
          margin-bottom: 10px;
        }

        .questionStem {
          font-weight: 500;
          letter-spacing: 1px;
          font-size: 18px;
          margin-bottom: 4px;
          line-height: 30px;
        }

        .questionOpt {
          .option {
            display: flex;
            align-items: flex-start;
            line-height: 28px;
            font-size: 18px;
            letter-spacing: 1px;
            position: relative;
            text-align: left;
            margin-bottom: 4px;

            .dot {
              flex: 0 0 auto;
              width: 14px;
              height: 14px;
              border-radius: 50%;
              background-color: #6C5DD3;
              margin-top: 7px;
            }

            .optText {
              flex: 1;
              margin-left: 8px;
              text-indent: 0;
              word-break: break-word;
            }
          }
        }

        .questionAnswer {
          letter-spacing: 1px;
          height: 30px;
          line-height: 30px;
          margin-top: 18px;
          display: flex;
          justify-content: flex-start;
          margin-bottom: 10px;

          .colorBefore {
            background-color: #6C5DD3;
            width: 8px;
            height: 30px;
            display: inline-block;
            border-radius: 4px;
            margin-right: 4px;
          }

          .correctAnswer {
            color: #707070;
            display: inline-block;
            height: 30px;
            line-height: 30px;
            font-size: 18px;
          }

          .false {
            color: #FF3B3B;
            display: inline-block;
            height: 30px;
            line-height: 30px;
            font-size: 18px;
          }

          .true {
            color: #0BDE00;
            display: inline-block;
            height: 30px;
            line-height: 30px;
            font-size: 18px;
          }

          .answer {
            display: inline-block;
            height: 30px;
            line-height: 30px;
            font-size: 18px;
            color: #5F89D3;
          }
        }
      }
    }
  }

  .bottomAlert {
    color: #999;
    font-size: 16px;
    margin-top: 40px;
    margin-bottom: 40px;
    line-height: 40px;
    height: 40px;
  }

  .practice-switch {
    margin-right: 12px;
    flex-shrink: 0;
  }

  .practice-area {
    margin: 10px 0;

    .practice-option {
      margin-bottom: 8px;
      line-height: 28px;
      font-size: 16px;
      text-align: left;

      .el-radio,
      .el-checkbox {
        display: flex;
        align-items: flex-start;
        height: auto;
        white-space: normal;
      }

      .el-radio__input,
      .el-checkbox__input {
        flex: 0 0 auto;
        margin-top: 4px;
      }

      .el-radio__label,
      .el-checkbox__label {
        display: block;
        flex: 1;
        white-space: normal;
        line-height: 24px;
        text-align: left;
        word-break: break-word;
      }
    }

    .fill-practice-row {
      display: flex;
      align-items: center;
      gap: 10px;

      .fill-input {
        max-width: 300px;
      }
    }

    .multi-submit {
      margin-top: 8px;
    }
  }

  .practice-result {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 10px 0;
    font-size: 16px;

    .result-tag {
      font-weight: bold;
      padding: 2px 10px;
      border-radius: 6px;
    }

    .result-true {
      color: #0BDE00;
      background: #f0fff0;
    }

    .result-false {
      color: #FF3B3B;
      background: #fff0f0;
    }

    .your-answer {
      color: #707070;
    }

    .correctAnswer {
      color: #5F89D3;
      font-weight: 500;
    }
  }
}
</style>
