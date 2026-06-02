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
          <!--          一键显示/隐藏答案开关-->
          <el-switch v-model="showAllAnswers" active-text="答案" inactive-text="" active-color="#6C5DD3"
            class="practice-switch" v-if="!practiceMode">
          </el-switch>
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
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
      <div v-if="showList == '' && onSearch">
        <el-empty description="搜索结果为空"></el-empty>
      </div>
      <div class="questionCover" v-for="(item, i) in showList" :key="i" :id="'qcard-' + i"
        @mouseenter="hoveredIndex = i" @mouseleave="hoveredIndex = null">
        <QuestionItem
          :question="item" :seq="i + 1"
          :practice-mode="practiceMode"
          :show-answer="showAnswers[i]"
          :practice-result="practiceResults[i] || null"
          :practice-answer="practiceAnswers[i]"
          :is-fav="isFav(item)" :is-marked="isMarked(item)"
          :is-favorites-view="$route.path === '/newHome/favorites'"
          :subject-label="abbreviationSubjectList[item.abbreviationSubject]"
          @toggle-answer="toggleAnswer(i)"
          @toggle-fav="toggleFav(item, i)"
          @toggle-mark="toggleMark(item)"
          @submit-practice="val => submitPractice(i, val)" />
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
import QuestionItem from '@/components/QuestionItem.vue'
import { getQuestionType } from '@/utils/questionType'

export default {
  components: { QuestionItem },
  setup() {
    return { store: useQuestionStore() }
  },
  data() {
    return {
      showAnswers: [],
      hoveredIndex: null,  // 鼠标当前悬浮的题目序号，用于快捷键显示答案
      currentIndex: -1,  // 键盘导航定位的题目序号（滚动到顶端的那道），用于 -/=/0 快捷键
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
  computed: {
    // 开关状态始终与 showAnswers 数组同步：
    // getter — 所有答案都显示时为 true
    // setter — 批量设置所有答案的显示/隐藏
    showAllAnswers: {
      get() {
        return this.showAnswers.length > 0 && this.showAnswers.every(v => v);
      },
      set(val) {
        this.showAnswers = this.showList.map(() => val);
        this.saveViewedState();
        // 持久化开关状态，刷新后可恢复
        const storageKey = this.getAnswerStorageKey();
        if (storageKey) {
          localStorage.setItem(storageKey + '_showAll', JSON.stringify(val));
        }
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
    // 快捷键：q 切换鼠标悬浮题目答案；- 上一题 / = 下一题 / 0 切换当前题答案（右手单手操作）
    window.addEventListener('keydown', this.handleHotkey);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleHotkey);
    if (this._suppressTimer) clearTimeout(this._suppressTimer);
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
      // 列表重建时，键盘导航定位回到未定位状态
      this.currentIndex = -1;
      // Try to restore from localStorage
      const storageKey = this.getAnswerStorageKey();
      let saved = {};
      if (storageKey) {
        try {
          saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
        } catch (e) { /* ignore */ }
      }
      // 优先检查"全部显示"标记
      const showAll = storageKey && localStorage.getItem(storageKey + '_showAll') === 'true';
      if (showAll) {
        this.showAnswers = this.showList.map(() => true);
      } else {
        this.showAnswers = this.showList.map((item, idx) => {
          if (saved[item.id]) return true;
          return this.defaultShowAnswer;
        });
      }
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
    handleHotkey(e) {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // q：切换鼠标悬浮题目的答案
      if (e.key === 'q' || e.key === 'Q') {
        if (this.hoveredIndex === null) return;
        this.toggleAnswer(this.hoveredIndex);
        return;
      }

      // 右手三连键：- 上一题 / = 下一题 / 0 切换当前题答案
      if (e.key === '-' || e.key === '=' || e.key === '0') {
        if (!this.showList.length) return;
        e.preventDefault();
        // 以页面顶端的题目为“当前题”，滚动期间保留乐观题号
        if (!this._suppressScrollSync) {
          this.currentIndex = this.getTopIndex();
        }
        if (e.key === '=') {
          this.goToQuestion(this.currentIndex + 1);
        } else if (e.key === '-') {
          this.goToQuestion(this.currentIndex < 0 ? 0 : this.currentIndex - 1);
        } else if (e.key === '0') {
          const idx = this.currentIndex < 0 ? 0 : this.currentIndex;
          this.currentIndex = idx;
          this.toggleAnswer(idx);
        }
      }
    },
    // 因为题卡有scroll-margin-top，滚动定位后当前题 top 会停在 ~16px，用 top 判断会偏到上一题。
    getTopIndex() {
      const n = this.showList.length;
      if (!n) return -1;
      const offset = 2;
      for (let i = 0; i < n; i++) {
        const el = document.getElementById('qcard-' + i);
        if (!el) continue;
        if (el.getBoundingClientRect().bottom > offset) return i;
      }
      return n - 1;
    },
    goToQuestion(index) {
      const clamped = Math.max(0, Math.min(index, this.showList.length - 1));
      this.currentIndex = clamped;
      this._suppressScrollSync = true;
      if (this._suppressTimer) clearTimeout(this._suppressTimer);
      this._suppressTimer = setTimeout(() => {
        this._suppressScrollSync = false;
      }, 500);
      this.$nextTick(() => {
        const el = document.getElementById('qcard-' + clamped);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    },
    updateShowList(type, checked) {
      const validSelectedTypes = Array.isArray(this.selectedTypes) ? this.selectedTypes : [];
      const validSelectedSubjects = Array.isArray(this.subjectFocus) ? this.subjectFocus : [];

      // 筛选题目：题型和科目取交集
      const filteredByType = validSelectedTypes.length
        ? this.list.filter((question) => validSelectedTypes.includes(getQuestionType(question)))
        : this.list; // 若未选择题型，保留所有题型

      const filteredBySubject = validSelectedSubjects.length
        ? filteredByType.filter((question) => validSelectedSubjects.includes(question.abbreviationSubject))
        : filteredByType; // 若未选择科目，保留所有科目

      this.showList = [...filteredBySubject];
      this.initShowAnswers();
    },
    handleCommand(e) {
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
    },
    submitPractice(index, userAnswer) {
      const question = this.showList[index];
      const qType = getQuestionType(question);
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
        this.currentIndex = -1
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
      this.currentIndex = -1
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
    margin: 10px 20px;
    //padding-left: 30px;
    align-items: center;
    height: 68px;

    .rightplace {
      margin-right: 30px;
      width: 35%;
      display: flex;
      flex-shrink: 0;

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
      margin-left: 20px;
      height: 68px;
      min-width: 0;
      overflow: hidden;

      .subjectSelector {
        margin-left: 20px;

        .el-select {
          line-height: 40px;
          width: 240px;
        }
      }
    }
  }

  .questionCover {
    background-color: #FFFFFF;
    padding: 14px 18px;
    margin: 15px 34px;
    border-radius: 24px;
    scroll-margin-top: 16px;  // 键盘 -/= 滚动定位时，与视口顶端留出空隙
    box-shadow: 0px -1px 8px 0px rgba(230, 232, 240, 0.9),
      -1px 0px 8px 0px rgba(230, 232, 240, 0.9),
      1px 0px 8px 0px rgba(230, 232, 240, 0.9),
      0px 1px 8px 0px rgba(230, 232, 240, 0.9);
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

  // ── Mobile / narrow-screen responsive ──────────────────
  @media (max-width: 767px) {
    .header {
      height: auto;
      flex-wrap: wrap;
      padding: 10px 0;

      .breadCrumb {
        width: 100%;
        margin-left: 0;
        padding: 0 12px;
        height: auto;
        line-height: 40px;
        box-sizing: border-box;

        .subjectSelector {
          margin-left: 10px;

          .el-select {
            width: 180px;
          }
        }
      }

      .rightplace {
        width: 100%;
        margin-right: 0;
        padding: 0 12px;
        box-sizing: border-box;
        height: 44px;
      }
    }

    .questionCover {
      margin: 10px 12px;
      padding: 10px 12px;
    }
  }
}
</style>
