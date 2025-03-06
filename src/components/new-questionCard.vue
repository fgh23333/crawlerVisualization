<script setup>
import { computed, ref } from "vue";
import markActive from "@/assets/icon/icon-mark-active.svg?url";
import mark from "@/assets/icon/icon-mark.svg?url";
import likeActive from "@/assets/icon/icon-like-active.svg?url";
import like from "@/assets/icon/icon-like.svg?url";

const props = defineProps({
  question: Object, // 单个题目对象
  index: Number // 题目序号
});

const emit = defineEmits(["toggleFlag"]);

// 处理标记 & 喜欢点击事件
const toggleFlag = (flagType) => {
  emit("toggleFlag", props.index, flagType);
};

const toggleAnswer = () => {
  showAnswer.value = !showAnswer.value;
};

const options = ["A", "B", "C", "D"];

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

const showAnswer = ref(false);

</script>

<template>
  <div class="questionCover">
    <div class="questionTypeCover">
      <div class="left">
        <span class="seq">{{ index + 1 }}</span>
      </div>
      <div class="right">
        <div class="markAndLike">
          <transition name="fade" mode="out-in">
            <img class="mark" :src="question.markFlag ? markActive : mark" @click="toggleFlag('markFlag')"
              :key="question.markFlag">
          </transition>
          <transition name="fade" mode="out-in">
            <img class="like" :src="question.likeFlag ? likeActive : like" @click="toggleFlag('likeFlag')"
              :key="question.likeFlag">
          </transition>
        </div>
        <div class="questionType">
          <span v-if="$route.path == '/newHome/favorites'">
            {{ question.abbreviationSubject }} -
          </span>
          <span>{{ questionTypeName }}</span>
        </div>
        <!-- 题目内容区域 -->
        <div class="questionContent">{{ question.questionStem }}</div>

        <!-- 题型对应的选项 -->
        <div v-if="question.type === 'rightWrong'">
          <div class="questionAnswer">
            <span class="colorBefore"></span>
            <span class="correctAnswer">正确答案：</span>
            <span class="true" @click="toggleAnswer()" v-if="question.answer == '正确'">{{ showAnswer ?
              question.answer : '' }}</span>
            <span class="false" @click="toggleAnswer()" v-if="question.answer == '错误'">{{ showAnswer ?
              question.answer : '' }}</span>
            <span class="answer" @click="toggleAnswer()" v-if="!showAnswer">点击显示答案</span>
          </div>
        </div>

        <div v-if="question.type === 'singleChoice'">
          <div class="questionOpt">
            <div class="option" v-for="(item, k) in question.option" :key="k">
              <div class="dot"></div>
              <div class="optText">{{ options[k] }}、{{ question.option[k] }}</div>
            </div>
          </div>
          <div class="questionAnswer">
            <span class="colorBefore"></span>
            <span class="correctAnswer">正确答案：</span>
            <span class="answer" @click="toggleAnswer()">{{ showAnswer ? question.answer : '点击显示答案' }}</span>
          </div>
        </div>

        <div v-if="question.type === 'multipleChoice'">
          <div class="questionOpt">
            <div class="option" v-for="(item, k) in question.option" :key="k">
              <div class="dot"></div>
              <div class="optText">{{ options[k] }}、{{ question.option[k] }}</div>
            </div>
          </div>
          <div class="questionAnswer">
            <span class="colorBefore"></span>
            <span class="correctAnswer">正确答案：</span>
            <span class="answer" @click="toggleAnswer()">{{ showAnswer ? question.answer : '点击显示答案'
            }}</span>
          </div>
        </div>

        <div v-if="question.type === 'fillingBlank'">
          <div class="questionAnswer">
            <span class="colorBefore"></span>
            <span class="correctAnswer">正确答案：</span>
            <span class="answer" @click="toggleAnswer()">{{ showAnswer ? question.answer : '点击显示答案'
            }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
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
      text-align: justify;
      position: relative;
      width: 94%;
      height: max-content;

      .markAndLike {
        width: 72px;
        height: 32px;
        position: absolute;
        top: 0px;
        right: 0px;

        .mark {
          display: inline-block;
          margin-right: 8px;
        }

        .like {
          display: inline-block;
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

      .questionContent {
        font-weight: 500;
        letter-spacing: 1px;
        font-size: 18px;
        margin-bottom: 4px;
        line-height: 30px;
      }

      .questionOpt {
        .option {
          line-height: 28px;
          font-size: 18px;
          letter-spacing: 1px;
          position: relative;

          .dot {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background-color: #6C5DD3;
            position: absolute;
            top: 7px;
          }

          .optText {
            text-indent: 22px;
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
</style>
