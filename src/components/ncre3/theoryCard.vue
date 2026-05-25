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

    <!-- 练习模式 -->
    <template v-if="practiceMode">
      <!-- 判断题 -->
      <div v-if="question.type === 'trueOrFalse'" class="practice-area">
        <el-radio-group v-model="practiceAnswer" @change="submitPractice" :disabled="!!practiceResult">
          <el-radio v-for="opt in question.option" :key="opt" :label="opt">{{ opt }}</el-radio>
        </el-radio-group>
      </div>
      <!-- 单选题 -->
      <div v-else-if="question.type === 'singleChoice'" class="practice-area">
        <el-radio-group v-model="practiceAnswer" @change="submitPractice" :disabled="!!practiceResult">
          <div v-for="(opt, i) in question.option" :key="i" class="practice-option">
            <el-radio :label="labels[i]">{{ labels[i] }}、{{ opt }}</el-radio>
          </div>
        </el-radio-group>
      </div>
      <!-- 多选题 -->
      <div v-else-if="question.type === 'multipleChoice'" class="practice-area">
        <el-checkbox-group v-model="practiceAnswers" :disabled="!!practiceResult">
          <div v-for="(opt, i) in question.option" :key="i" class="practice-option">
            <el-checkbox :label="labels[i]">{{ labels[i] }}、{{ opt }}</el-checkbox>
          </div>
        </el-checkbox-group>
        <el-button v-if="!practiceResult" type="primary" size="small" @click="submitMultiPractice"
          :disabled="practiceAnswers.length === 0" style="margin-top: 8px;">确认提交</el-button>
      </div>
      <!-- 练习结果 -->
      <div v-if="practiceResult" class="practice-result">
        <span class="result-tag" :class="practiceResult.isCorrect ? 'result-true' : 'result-false'">
          {{ practiceResult.isCorrect ? '回答正确' : '回答错误' }}
        </span>
        <span class="your-answer">你的答案：{{ practiceResult.userAnswer }}</span>
        <span class="correct-answer" v-if="!practiceResult.isCorrect">正确答案：{{ question.answer }}</span>
      </div>
    </template>

    <!-- 普通模式 -->
    <template v-else>
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
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { Star, Flag } from '@element-plus/icons-vue'
import { useNcre3Store } from '@/stores/ncre3'

const store = useNcre3Store()
const props = defineProps({
  question: { type: Object, required: true },
  index: { type: Number, default: 0 },
  showAnswer: { type: Boolean, default: false },
  practiceMode: { type: Boolean, default: false }
})

const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

const practiceAnswer = ref('')
const practiceAnswers = ref([])
const practiceResult = ref(null)

// Reset practice state when question changes or mode toggles
watch(() => [props.question.id, props.practiceMode], () => {
  practiceAnswer.value = ''
  practiceAnswers.value = []
  practiceResult.value = null
})

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

function submitPractice(val) {
  let isCorrect = false
  if (props.question.type === 'trueOrFalse') {
    isCorrect = val === props.question.answer
  } else if (props.question.type === 'singleChoice') {
    isCorrect = val === props.question.answer
  }
  practiceResult.value = { isCorrect, userAnswer: val }
  if (!isCorrect) {
    store.addWrong(props.question)
  }
}

function submitMultiPractice() {
  const correctAnswers = props.question.answer.split('')
  const sorted = [...practiceAnswers.value].sort()
  const isCorrect = sorted.length === correctAnswers.length &&
    sorted.every((a, i) => a === correctAnswers[i])
  practiceResult.value = { isCorrect, userAnswer: practiceAnswers.value.join('') }
  if (!isCorrect) {
    store.addWrong(props.question)
  }
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

  .practice-area {
    margin-top: 10px;

    .practice-option {
      margin-bottom: 6px;
      line-height: 28px;
      font-size: 15px;
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
  }

  .practice-result {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 10px;
    font-size: 15px;

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

    .correct-answer {
      color: #5F89D3;
      font-weight: 500;
    }
  }
}
</style>
