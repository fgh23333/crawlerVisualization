<script setup>
// 用一份模板按题型 computed 分支替代原来四段重复块
// 用一份模板按题型 computed 分支进对应题型
// 所有数据经 props 传入，交互经 emit 上抛，没有逻辑修改
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { renderMarkdown } from '@/utils/renderMarkdown'
import { getQuestionType, TYPE_LABEL } from '@/utils/questionType'

const props = defineProps({
  question: { type: Object, required: true },
  seq: { type: Number, required: true },
  practiceMode: { type: Boolean, default: false },
  showAnswer: { type: Boolean, default: false },
  practiceResult: { type: Object, default: null },
  practiceAnswer: { type: [String, Array], default: null },
  isFav: { type: Boolean, default: false },
  isMarked: { type: Boolean, default: false },
  isFavoritesView: { type: Boolean, default: false },
  subjectLabel: { type: String, default: '' },
  // 端侧 AI 剖析：文本与加载态由父组件注入（组件保持纯展示）
  aiText: { type: String, default: '' },
  aiLoading: { type: Boolean, default: false },
  // 环境是否支持端侧 AI：不支持时整个入口不渲染
  aiAvailable: { type: Boolean, default: false }
})

const emit = defineEmits(['toggle-answer', 'toggle-fav', 'toggle-mark', 'submit-practice', 'ask-ai'])

const options = ['A', 'B', 'C', 'D', 'E']
const type = computed(() => getQuestionType(props.question))

// 收录时间标签：旧缓存数据无 collectedAt 字段时不显示
const collectedLabel = computed(() =>
  props.question.collectedAt ? `收录于 ${String(props.question.collectedAt).slice(0, 7)}` : ''
)

// 练习输入本地状态：初始/回填自 practiceAnswer prop（父组件仍按下标存储）
const localChoice = ref(typeof props.practiceAnswer === 'string' ? props.practiceAnswer : null) // 判断/单选
const localMulti = ref(Array.isArray(props.practiceAnswer) ? [...props.practiceAnswer] : [])      // 多选
const localFill = ref(typeof props.practiceAnswer === 'string' ? props.practiceAnswer : '')       // 填空

// 父组件重置 practiceAnswers（练习模式切换/路由切换）时，同步清空本地输入
watch(() => props.practiceAnswer, (val) => {
  localChoice.value = typeof val === 'string' ? val : null
  localMulti.value = Array.isArray(val) ? [...val] : []
  localFill.value = typeof val === 'string' ? val : ''
})

const onChoiceChange = (val) => emit('submit-practice', val)
const submitFill = () => emit('submit-practice', localFill.value)
const submitMulti = () => emit('submit-practice', localMulti.value)

// AI 剖析结果：流式文本经 100ms 节流做 markdown 渲染（含 LaTeX 箭头等符号归一化）
const parsedAi = ref('')
let _aiParseTimer = null
watch(() => props.aiText, () => {
  if (_aiParseTimer) return
  _aiParseTimer = setTimeout(() => {
    _aiParseTimer = null
    parsedAi.value = renderMarkdown(props.aiText || '')
  }, 100)
}, { immediate: true })
onBeforeUnmount(() => { if (_aiParseTimer) clearTimeout(_aiParseTimer) })
</script>

<template>
  <div class="typeCover">
    <div class="questionTypeCover">
      <div class="left">
        <span class="seq">{{ seq }}</span>
      </div>
      <div class="right">
        <div class="markAndLike">
          <button class="fav-btn mark-btn" :class="{ 'is-fav': isMarked }" @click="emit('toggle-mark')" type="button">
            <svg class="fav-icon" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
              <path d="M7 3h10a1 1 0 0 1 1 1v17l-6-3.5L6 21V4a1 1 0 0 1 1-1z"
                :fill="isMarked ? 'currentColor' : 'none'"
                stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
            </svg>
            <span class="fav-text">{{ isMarked ? '已标记' : '标记' }}</span>
          </button>
          <button class="fav-btn" :class="{ 'is-fav': isFav }" @click="emit('toggle-fav')" type="button">
            <svg class="fav-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path d="M12 2.5l2.95 6.36 6.55.66-4.9 4.79 1.39 6.69L12 17.77l-6 3.23 1.39-6.69L2.5 9.52l6.55-.66L12 2.5z"
                :fill="isFav ? 'currentColor' : 'none'"
                stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
            </svg>
            <span class="fav-text">{{ isFav ? '已收藏' : '收藏' }}</span>
          </button>
          <button v-if="aiAvailable" class="fav-btn ai-analyze-btn" :class="{ 'is-ai-loading': aiLoading }" @click="emit('ask-ai')" type="button">
            <svg class="fav-icon" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
              <path d="M12 2.5l1.9 5.2 5.4 1.9-5.4 1.9L12 16.7l-1.9-5.2-5.4-1.9 5.4-1.9L12 2.5z"
                :fill="aiLoading ? 'currentColor' : 'none'"
                stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
              <path d="M18.5 15.5l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9.9-2.4z"
                :fill="aiLoading ? 'currentColor' : 'none'"
                stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
            </svg>
            <span class="fav-text">{{ aiLoading ? '停止' : 'AI 剖析' }}</span>
          </button>
        </div>
        <div class="questionType">
          <span v-if="isFavoritesView">{{ subjectLabel }} - </span>
          <span>{{ TYPE_LABEL[type] }}</span>
          <span v-if="collectedLabel" class="collected-tag">{{ collectedLabel }}</span>
          <span v-if="question.isHighFreq" class="freq-tag">高频</span>
        </div>
        <div class="questionStem">{{ question.questionStem }}</div>

        <!-- 练习模式：判断题 -->
        <div class="practice-area" v-if="practiceMode && type === 'rightWrong' && !practiceResult">
          <el-radio-group v-model="localChoice" @change="onChoiceChange">
            <el-radio v-for="(opt, k) in question.option" :key="k" :label="opt">{{ opt }}</el-radio>
          </el-radio-group>
        </div>

        <!-- 练习模式：填空题 -->
        <div class="practice-area" v-if="practiceMode && type === 'fillingBlank' && !practiceResult">
          <div class="fill-practice-row">
            <el-input v-model="localFill" placeholder="请输入答案" class="fill-input"
              @keyup.enter.native="submitFill"></el-input>
            <el-button type="primary" size="small" @click="submitFill" class="fill-submit">提交</el-button>
          </div>
        </div>

        <!-- 练习模式：单选题 -->
        <div class="practice-area" v-if="practiceMode && type === 'singleChoice'">
          <el-radio-group v-model="localChoice" @change="onChoiceChange" :disabled="!!practiceResult">
            <div v-for="(opt, k) in question.option" :key="k" class="practice-option">
              <el-radio :label="options[k]">{{ options[k] }}、{{ opt }}</el-radio>
            </div>
          </el-radio-group>
        </div>

        <!-- 练习模式：多选题 -->
        <div class="practice-area" v-if="practiceMode && type === 'multipleChoice'">
          <el-checkbox-group v-model="localMulti" :disabled="!!practiceResult">
            <div v-for="(opt, k) in question.option" :key="k" class="practice-option">
              <el-checkbox :label="options[k]">{{ options[k] }}、{{ opt }}</el-checkbox>
            </div>
          </el-checkbox-group>
          <el-button v-if="!practiceResult" type="primary" size="small" @click="submitMulti"
            :disabled="!localMulti || localMulti.length === 0" class="multi-submit">确认提交</el-button>
        </div>

        <!-- 普通模式选项（单选/多选） -->
        <div class="questionOpt" v-if="!practiceMode && (type === 'singleChoice' || type === 'multipleChoice')">
          <div class="option" v-for="(opt, k) in question.option" :key="k">
            <div class="dot"></div>
            <div class="optText">{{ options[k] }}、{{ question.option[k] }}</div>
          </div>
        </div>

        <!-- 练习结果（所有题型） -->
        <div class="practice-result" v-if="practiceMode && practiceResult">
          <span class="result-tag" :class="practiceResult.isCorrect ? 'result-true' : 'result-false'">
            {{ practiceResult.isCorrect ? '回答正确' : '回答错误' }}
          </span>
          <span class="your-answer">你的答案：{{ practiceResult.userAnswer }}</span>
          <span class="correctAnswer" v-if="!practiceResult.isCorrect">正确答案：{{ question.answer }}</span>
        </div>

        <!-- 普通模式答案：判断题 -->
        <div class="questionAnswer" v-if="!practiceMode && type === 'rightWrong'">
          <span class="colorBefore"></span>
          <span class="correctAnswer">正确答案：</span>
          <span class="true" @click="emit('toggle-answer')" v-if="question.answer == '正确'">{{ showAnswer ? question.answer : '' }}</span>
          <span class="false" @click="emit('toggle-answer')" v-if="question.answer == '错误'">{{ showAnswer ? question.answer : '' }}</span>
          <span class="answer" @click="emit('toggle-answer')" v-if="!showAnswer">点击显示答案</span>
        </div>

        <!-- 普通模式答案：其余题型 -->
        <div class="questionAnswer" v-if="!practiceMode && type !== 'rightWrong'">
          <span class="colorBefore"></span>
          <span class="correctAnswer">正确答案：</span>
          <span class="answer" @click="emit('toggle-answer')">{{ showAnswer ? question.answer : '点击显示答案' }}</span>
        </div>

        <!-- 端侧 AI 深度剖析（Beta，本地生成；由父组件注入文本与加载态） -->
        <div class="ai-analysis" v-if="aiLoading || parsedAi">
          <div class="ai-analysis-head">
            <span class="ai-badge">AI 剖析</span>
            <span class="ai-beta">Beta · 本地端侧生成</span>
            <span class="ai-loading-hint" v-if="aiLoading">生成中…</span>
          </div>
          <div class="ai-analysis-body">
            <el-skeleton v-if="aiLoading && !parsedAi" :rows="3" animated />
            <template v-else>
              <div class="ai-html" v-html="parsedAi"></div>
              <span v-if="aiLoading" class="typing-cursor">▍</span>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

// AI 剖析按钮图标呼吸 / 打字机光标闪烁
@keyframes ai-spark-pulse {

  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }

  50% {
    transform: scale(1.25);
    opacity: 0.6;
  }
}

@keyframes ai-blink-cursor {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0;
  }
}

.typeCover {
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

          // AI 剖析按钮：生成中呈实心紫 + 图标呼吸，提示可点击停止
          &.ai-analyze-btn.is-ai-loading {
            background-color: #6C5DD3;
            color: #fff;
            border-color: #6C5DD3;

            .fav-icon {
              animation: ai-spark-pulse 1s ease-in-out infinite;
            }

            &:hover {
              background-color: #5B4FB5;
              border-color: #5B4FB5;
            }
          }
        }
      }

      // 端侧 AI 深度剖析结果区（流式 markdown，Beta）
      .ai-analysis {
        margin-top: 10px;
        border-left: 3px solid #6C5DD3;
        background: #f7f6ff;
        border-radius: 6px;
        padding: 10px 12px;

        .ai-analysis-head {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;

          .ai-badge {
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 1px;
            color: #fff;
            background: linear-gradient(135deg, #8b7cf0, #6c5dd3);
            border-radius: 4px;
            padding: 1px 6px;
          }

          .ai-beta {
            font-size: 11px;
            color: #9a93c9;
          }

          .ai-loading-hint {
            font-size: 11px;
            color: #6C5DD3;
          }
        }

        .ai-analysis-body {
          font-size: 13px;
          color: #444;
          line-height: 1.7;

          .ai-html {

            // marked 输出的富文本规则（照 gemma.vue 聊天区收敛）
            p {
              margin: 0 0 6px;
            }

            h1, h2, h3, h4 {
              font-size: 14px;
              margin: 8px 0 4px;
              color: #5b4fd6;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin: 6px 0;

              th, td {
                border: 1px solid #ddd6f8;
                padding: 4px 8px;
                font-size: 12px;
              }

              th {
                background: #efecfb;
              }
            }

            code {
              background: #eee9fc;
              color: #5b4fd6;
              padding: 1px 5px;
              border-radius: 4px;
              font-size: 12px;
            }

            pre {
              background: #f4f2fd;
              border-radius: 6px;
              padding: 8px 10px;
              overflow-x: auto;
              margin: 6px 0;

              code {
                background: none;
                padding: 0;
              }
            }

            ul, ol {
              padding-left: 18px;
              margin: 4px 0;
            }

            blockquote {
              margin: 6px 0;
              padding-left: 10px;
              border-left: 3px solid #c9c2ef;
              color: #777;
            }
          }

          .typing-cursor {
            display: inline-block;
            color: #6C5DD3;
            animation: ai-blink-cursor 0.8s infinite;
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

        // 收录时间：弱化的元信息标签
        .collected-tag {
          margin-left: 10px;
          font-size: 12px;
          font-weight: normal;
          letter-spacing: 0.5px;
          color: #b3b3cc;
          vertical-align: 2px;
        }

        // 高频题徽标（官方随机卷中出现权重高）
        .freq-tag {
          margin-left: 8px;
          padding: 1px 8px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: normal;
          letter-spacing: 1px;
          color: #e8821e;
          background: rgba(232, 130, 30, 0.1);
          border: 1px solid rgba(232, 130, 30, 0.35);
          vertical-align: 4px;
        }
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
