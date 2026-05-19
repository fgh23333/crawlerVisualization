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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Timer } from '@element-plus/icons-vue'
import { useQuestionStore } from '@/stores/question'
import { loadNcre3Data } from '@/utils/ncre3Loader'
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

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function onExamStatus(status) {
  examStatus.value = status
  if (status) stopTimer()
}

onMounted(async () => {
  // Reset store state
  store.answerList = []
  store.results = []
  store.score = null
  examStatus.value = false
  timerSeconds.value = 0
  startTimer()

  try {
    const all = await loadNcre3Data('ncre3_theory_all')
    const picked = shuffle(all).slice(0, 100)
    store.loadQuestionBank(picked)
    questionList.value = picked
  } catch (e) {
    console.error('Failed to load theory questions:', e)
    store.loadQuestionBank([])
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => { stopTimer() })
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
