<template>
  <div class="theory-card">
    <div class="card-header">
      <span class="seq-badge">{{ index + 1 }}</span>
      <el-tag size="small" :type="question.type === 'trueOrFalse' ? 'warning' : 'primary'">
        {{ typeLabel }}
      </el-tag>
      <div class="actions">
        <el-button :type="store.isLiked(question.id) ? 'warning' : 'default'" circle size="small" @click="toggleLike">
          <el-icon><Star /></el-icon>
        </el-button>
        <el-button :type="store.isWrong(question.id) ? 'danger' : 'default'" circle size="small" @click="toggleWrong">
          <el-icon><Flag /></el-icon>
        </el-button>
      </div>
    </div>

    <div class="question-stem">{{ question.questionStem }}</div>

    <div class="options">
      <div v-for="(opt, i) in question.option" :key="i" class="option-item">
        <span class="option-label" :class="{ highlight: showAnswer && isOptionCorrect(i) }">{{ labels[i] }}、</span>
        <span class="option-text" :class="{ highlight: showAnswer && isOptionCorrect(i) }">{{ opt }}</span>
      </div>
    </div>

    <div v-if="showAnswer" class="answer-area">
      <span class="color-bar"></span>
      <span class="correct-answer">正确答案：{{ question.answer }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Star, Flag } from '@element-plus/icons-vue'
import { useNcre3Store } from '@/stores/ncre3'

const store = useNcre3Store()
const props = defineProps({
  question: { type: Object, required: true },
  index: { type: Number, default: 0 },
  showAnswer: { type: Boolean, default: false }
})

const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

const typeLabel = computed(() => {
  const map = { trueOrFalse: '判断', singleChoice: '单选', multipleChoice: '多选' }
  return map[props.question.type] || '未知'
})

function isOptionCorrect(index) {
  return props.question.answer.includes(labels[index])
}

function toggleLike() {
  if (store.isLiked(props.question.id)) store.removeLike(props.question.id)
  else store.addLike(props.question)
}

function toggleWrong() {
  if (store.isWrong(props.question.id)) store.removeWrong(props.question.id)
  else store.addWrong(props.question)
}
</script>

<style lang="scss" scoped>
.theory-card {
  background: #fff;
  border-radius: 16px;
  padding: 18px 20px;
  margin-bottom: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

  .card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;

    .seq-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 30px;
      height: 26px;
      padding: 0 8px;
      background: #6C5DD3;
      color: white;
      border-radius: 8px;
      font-size: 14px;
      font-weight: bold;
    }

    .actions {
      margin-left: auto;
      display: flex;
      gap: 4px;
    }
  }

  .question-stem {
    font-size: 16px;
    font-weight: 500;
    color: #333;
    line-height: 1.8;
    margin-bottom: 12px;
    text-align: justify;
  }

  .options {
    display: flex;
    flex-direction: column;
    gap: 6px;

    .option-item {
      display: flex;
      align-items: flex-start;
      text-align: left;
      line-height: 1.6;
      font-size: 15px;
      color: #5F89D3;

      .option-label {
        flex-shrink: 0;
        font-weight: 500;
      }

      .option-text {
        word-break: break-word;
      }

      .highlight {
        color: #6C5DD3;
        font-weight: bold;
      }
    }
  }

  .answer-area {
    margin-top: 14px;
    padding-top: 10px;
    display: flex;
    align-items: center;
    gap: 8px;

    .color-bar {
      display: inline-block;
      width: 6px;
      height: 22px;
      background: #6C5DD3;
      border-radius: 3px;
      flex-shrink: 0;
    }

    .correct-answer {
      font-size: 15px;
      color: #707070;
    }
  }
}
</style>
