<template>
  <div class="sql-answer-card">
    <div class="card-header">
      <div class="question-info">
        <el-tag type="primary" size="small" round>{{ item.database }} - 第{{ item.questionIndex }}题</el-tag>
      </div>
      <div class="actions">
        <el-button :type="store.isLiked(item.id) ? 'warning' : 'default'" circle size="small" @click="toggleLike">
          <el-icon><Star /></el-icon>
        </el-button>
        <el-button :type="store.isWrong(item.id) ? 'danger' : 'default'" circle size="small" @click="toggleWrong">
          <el-icon><Flag /></el-icon>
        </el-button>
      </div>
    </div>
    <div class="question-stem">{{ item.questionStem }}</div>
    <div class="answer-section">
      <el-button type="primary" text @click="showAnswer = !showAnswer">
        {{ showAnswer ? '隐藏答案' : '查看答案' }}
        <el-icon><component :is="showAnswer ? 'ArrowUp' : 'ArrowDown'" /></el-icon>
      </el-button>
      <transition name="fade">
        <div v-if="showAnswer" class="answer-content">
          <codeBlock :code="item.answer" :language="item.language" />
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Star, Flag, ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import { useNcre3Store } from '@/stores/ncre3'
import codeBlock from './codeBlock.vue'

const store = useNcre3Store()
const props = defineProps({ item: { type: Object, required: true } })
const showAnswer = ref(false)

function toggleLike() {
  if (store.isLiked(props.item.id)) {
    store.removeLike(props.item.id)
  } else {
    store.addLike(props.item)
  }
}

function toggleWrong() {
  if (store.isWrong(props.item.id)) {
    store.removeWrong(props.item.id)
  } else {
    store.addWrong(props.item)
  }
}
</script>

<style lang="scss" scoped>
.sql-answer-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 4px 20px rgba(108, 93, 211, 0.1);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .question-stem {
    font-size: 15px;
    color: #333;
    line-height: 1.8;
    margin-bottom: 12px;
    text-align: left;
  }

  .answer-section {
    text-align: left;

    .answer-content {
      margin-top: 8px;
    }
  }
}

.fade-enter-active, .fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>
