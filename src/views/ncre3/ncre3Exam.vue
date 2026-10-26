<template>
  <div class="ncre3-exam">
    <div class="exam-header">
      <el-button text @click="$router.push('/ncre3')">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <h2 class="exam-title">理论题随机练习</h2>
      <div class="header-right">
        <el-switch v-model="autoSave" active-text="错题收录" inactive-text="" active-color="#6C5DD3" />
        <div class="exam-timer" :class="{ 'timer-warning': timerSeconds >= 1800 }">
          <el-icon><Timer /></el-icon>
          <span>{{ formattedTime }}</span>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-area">
      <el-skeleton :rows="5" animated />
    </div>

    <div v-else class="exam-body">
      <div class="exam-main">
        <examCard v-for="(item, i) in questionList" :key="item.id" :question="item" :seq="i" :examStatus="examStatus" />
      </div>
      <div class="exam-sidebar">
        <examRecord @examStatus="onExamStatus" :autoSave="autoSave" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { ArrowLeft, Timer } from '@element-plus/icons-vue'
import { useQuestionStore } from '@/stores/question'
import { loadNcre3Data } from '@/utils/ncre3Loader'
import { weightedSample } from '@/utils/quizGenerator'
import { loadExamSnapshot, clearExamSnapshot, matchesSnapshot, countAnswered } from '@/utils/examSnapshot'
import examCard from '@/components/examCard.vue'
import examRecord from '@/components/examRecord.vue'

const router = useRouter()
const store = useQuestionStore()

const loading = ref(true)
const questionList = ref([])
const examStatus = ref(false)
const autoSave = ref(true)
const timerSeconds = ref(0)
let timerInterval = null

const formattedTime = computed(() => {
  const h = Math.floor(timerSeconds.value / 3600)
  const m = Math.floor((timerSeconds.value % 3600) / 60)
  const s = timerSeconds.value % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

function startTimer() {
  timerInterval = setInterval(() => { timerSeconds.value++ }, 1000)
}

function stopTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null }
}

function onExamStatus(status) {
  examStatus.value = status
  if (status) stopTimer()
}

// ── 作答进度快照：防意外退出丢失未提交作答 ──────────────
const SNAP_META = { kind: 'ncre3', lesson: 'ncre3', paperId: 'theory' }
let snapTimer = null
function scheduleSnapshot() {
  if (snapTimer) clearTimeout(snapTimer)
  snapTimer = setTimeout(() => {
    snapTimer = null
    flushSnapshot()
  }, 1000)
}
function flushSnapshot() {
  if (snapTimer) { clearTimeout(snapTimer); snapTimer = null }
  // 已提交的卷由 checkAnswer 清快照，不落新的
  if (examStatus.value) return
  store.saveExamProgress(SNAP_META.kind, SNAP_META.lesson, SNAP_META.paperId, timerSeconds.value)
}
const onBeforeUnload = () => flushSnapshot()
watch(() => store.answerList, scheduleSnapshot, { deep: true })

async function askRestore(snap) {
  try {
    await ElMessageBox.confirm(
      `检测到上次未提交的作答：已答 ${countAnswered(snap.answerList)}/${snap.questions.length} 题，保存于 ${new Date(snap.savedAt).toLocaleString('zh-CN')}。是否恢复继续作答？`,
      '恢复作答',
      { confirmButtonText: '恢复', cancelButtonText: '重新开始', type: 'info' }
    )
    return true
  } catch (e) {
    return false
  }
}

onMounted(async () => {
  window.addEventListener('beforeunload', onBeforeUnload)

  // Reset store state
  store.answerList = []
  store.results = []
  store.score = null
  examStatus.value = false
  timerSeconds.value = 0
  startTimer()

  try {
    // 未提交作答恢复：有本卷快照且已有作答 → 询问是否续答
    const snap = loadExamSnapshot()
    if (snap && matchesSnapshot(snap, SNAP_META) && countAnswered(snap.answerList) > 0) {
      if (await askRestore(snap)) {
        store.restoreExamProgress(snap)
        timerSeconds.value = snap.elapsed
        questionList.value = store.questionBank
      } else {
        clearExamSnapshot()
      }
    }

    if (questionList.value.length === 0) {
      const all = await loadNcre3Data('ncre3_theory_all')
      // 掌握度加权抽样：ncre3 题无 appearCount，基础权重退化为均匀基数，
      // 个性化完全来自掌握度乘子（薄弱题 0.4~1.6 倍倾斜）；无记录用户等价均匀随机
      const picked = weightedSample(all, 100, store.userRecords)
      store.loadQuestionBank(picked)
      questionList.value = picked
    }
  } catch (e) {
    console.error('Failed to load theory questions:', e)
    store.loadQuestionBank([])
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  stopTimer()
  // 离开考试页前落盘，未提交作答下次可恢复
  flushSnapshot()
  window.removeEventListener('beforeunload', onBeforeUnload)
})
</script>

<style lang="scss" scoped>
.ncre3-exam {
  max-width: 1200px;
  margin: 0 auto;

  .exam-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;

    .exam-title {
      font-size: 22px;
      font-weight: bold;
      color: #333;
      margin: 0;
      flex: 1;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;

      .exam-timer {
        background: #f0edff;
        color: #6C5DD3;
        padding: 4px 14px;
        border-radius: 20px;
        font-size: 15px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 6px;

        &.timer-warning {
          background: #fff3f0;
          color: #FF3B3B;
        }
      }
    }
  }

  .loading-area {
    padding: 40px 20px;
  }

  .exam-body {
    display: flex;
    gap: 20px;

    .exam-main {
      flex: 1;
      min-width: 0;
    }

    .exam-sidebar {
      width: 240px;
      flex-shrink: 0;
      position: sticky;
      top: 0;
      height: fit-content;
    }
  }
}
</style>
