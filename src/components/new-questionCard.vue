<script setup>
import { computed } from "vue";

const props = defineProps({
  question: Object, // 单个题目对象
  index: Number // 题目序号
});

const emit = defineEmits(["toggleFlag"]);

// 处理标记 & 喜欢点击事件
const toggleFlag = (flagType) => {
  emit("toggleFlag", props.index, flagType);
};

// 计算题型名称
const questionTypeName = computed(() => {
  const typeMap = {
    "rightWrong": "判断",
    "singleChoice": "单选",
    "multipleChoice": "多选",
    "fillingBlank": "填空"
  };
  return typeMap[props.question.type] || "未知题型";
});
</script>

<template>
  <div class="typeCover">
    <div class="questionTypeCover">
      <div class="left">
        <span class="seq">{{ index + 1 }}</span>
      </div>
      <div class="right">
        <div class="markAndLike">
          <transition name="fade" mode="out-in">
            <img class="mark"
              :src="question.markFlag ? require('@/assets/icon/icon-mark-active.svg') : require('@/assets/icon/icon-mark.svg')"
              @click="toggleFlag('markFlag')"
              :key="question.markFlag">
          </transition>
          <transition name="fade" mode="out-in">
            <img class="like"
              :src="question.likeFlag ? require('@/assets/icon/icon-like-active.svg') : require('@/assets/icon/icon-like.svg')"
              @click="toggleFlag('likeFlag')"
              :key="question.likeFlag">
          </transition>
        </div>
        <div class="questionType">
          <span v-if="$route.path == '/newHome/favorites'">
            {{ question.subject }} -
          </span>
          <span>{{ questionTypeName }}</span>
        </div>
      </div>
    </div>

    <!-- 题目内容区域 -->
    <div class="questionContent">
      <p>{{ question.text }}</p>

      <!-- 题型对应的选项 -->
      <div v-if="question.type === 'rightWrong'">
        <button>对</button>
        <button>错</button>
      </div>

      <div v-if="question.type === 'singleChoice'">
        <div v-for="(option, i) in question.options" :key="i">
          <input type="radio" :name="'single' + index" :value="option">
          <label>{{ option }}</label>
        </div>
      </div>

      <div v-if="question.type === 'multipleChoice'">
        <div v-for="(option, i) in question.options" :key="i">
          <input type="checkbox" :value="option">
          <label>{{ option }}</label>
        </div>
      </div>

      <div v-if="question.type === 'fillingBlank'">
        <input type="text" placeholder="请输入答案">
      </div>
    </div>
  </div>
</template>

<style scoped>
.typeCover {
  border: 1px solid #ddd;
  padding: 10px;
  margin-bottom: 15px;
  border-radius: 5px;
}

.questionTypeCover {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.left .seq {
  font-size: 16px;
  font-weight: bold;
}

.right {
  display: flex;
  align-items: center;
}

.markAndLike img {
  width: 24px;
  margin-left: 10px;
  cursor: pointer;
}

.questionContent {
  margin-top: 10px;
}

button {
  margin: 5px;
  padding: 5px 10px;
}
</style>
