<template>
    <div id="examCard">
        <div class="left">
            <span class="seq">{{ seq + 1 }}</span>
        </div>
        <div class="right">
            <div class="questionType">
                <span>{{ questionType }}</span>
            </div>
            <div class="questionStem">{{ question.questionStem }}</div>
            <div class="questionAnswer">
                <div class="multiple" v-if="questionType == '多选'">
                    <el-checkbox-group v-model="answerModel" :disabled="examStatus" class="checkbox-group">
                        <div v-for="(item, i) in question.option" :key="i" class="answer">
                            <el-checkbox :label="options[i]" :key="i" class="option checkbox-item copyable-option">
                                <span class="copyable-text">{{ options[i] + '、' + item }}</span>
                            </el-checkbox>
                        </div>
                    </el-checkbox-group>
                </div>
                <div class="single" v-if="questionType == '判断' || questionType == '单选'">
                    <el-radio-group v-model="answerModel" :disabled="examStatus" class="radio-group">
                        <div v-for="(item, i) in question.option" :key="i" class="answer">
                            <el-radio :label="question.option.length == 2 ? item : options[i]"
                                class="option copyable-option">
                                <span class="copyable-text">{{ options[i] + '、' + item }}</span>
                            </el-radio>
                        </div>
                    </el-radio-group>
                </div>
                <div class="fillingBlank" v-if="questionType == '填空'">
                    <el-input class="copyable-option" v-model="answerModel" :disabled="examStatus"
                        placeholder="请输入答案"></el-input>
                </div>
                <div class="trueAnswer" v-if="examStatus">
                    <span class="colorBefore"></span>
                    <span class="answerStatus true"
                        v-if="answerResult && answerResult.isCorrect">回答正确</span>
                    <span class="answerStatus false"
                        v-if="answerResult && answerResult.isCorrect === false">回答错误</span>
                    <span class="correctAnswer">正确答案：</span>
                    <span class="answer">{{ question.answer }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { useQuestionStore } from '@/stores/question'

export default {
    setup() { return { store: useQuestionStore() } },
    data() {
        return {
            options: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T']
        }
    },
    props: {
        question: {
            type: Object,
            default: () => {
                return {}
            }
        },
        seq: {
            type: Number,
            default: 0
        },
        examStatus: {
            type: Boolean,
            default: false
        }
    },
    computed: {
        questionType() {
            if (this.question.option == '') {
                return '填空'
            } else if (this.question.option.length == 2) {
                return '判断'
            } else if (this.question.answer.length == 1) {
                return '单选'
            } else {
                return '多选'
            }
        },
        answerModel: {
            get() {
                const value = this.store.answerList[this.seq]
                if (this.questionType == '多选') {
                    return Array.isArray(value) ? value : []
                }
                return Array.isArray(value) ? '' : (value ?? '')
            },
            set(value) {
                this.store.answerList[this.seq] = value
            }
        },
        answerResult() {
            return this.store.results.find(item => item.questionId == this.question.id)
        }
    },
    methods: {
        updateOption(questionIndex, option) {
            this.store.answerList[questionIndex] = option
        },
    }
}
</script>

<style lang="scss">
.checkbox-group,
.radio-group {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
}

.checkbox-item {
    display: flex;
    align-items: flex-start;
    margin-bottom: 0;
}

.el-checkbox {
    align-items: flex-start;
}

/* 禁用选项的鼠标事件 */
.copyable-option[disabled] {
    pointer-events: none;

    .copyable-text {
        pointer-events: all !important;
        /* 恢复文本的鼠标事件 */
        user-select: text !important;
        /* 允许文本被选中 */
        cursor: text;
    }
}

#examCard {
    background-color: #FFFFFF;
    padding: 14px 18px;
    margin: 15px 20px;
    border-radius: 24px;
    box-shadow:
        0px -1px 8px 0px rgba(230, 232, 240, 0.9),
        -1px 0px 8px 0px rgba(230, 232, 240, 0.9),
        1px 0px 8px 0px rgba(230, 232, 240, 0.9),
        0px 1px 8px 0px rgba(230, 232, 240, 0.9);
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
        width: 92%;

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

        .questionStem {
            font-weight: 500;
            letter-spacing: 1px;
            font-size: 18px;
            margin-bottom: 4px;
            line-height: 30px;
        }

        .questionAnswer {
            letter-spacing: 1px;
            line-height: 30px;
            margin-top: 8px;
            margin-bottom: 10px;

            .answer {
                display: flex;
                justify-content: flex-start;
                line-height: 24px;
                margin-bottom: 8px;
                color: #5F89D3;
                text-align: left;

                .option {
                    display: flex;
                    align-items: flex-start;
                    justify-content: flex-start;
                    width: 100%;
                    height: auto;
                    margin-right: 0;
                    white-space: normal;
                    text-align: left;
                }

                span {
                    word-wrap: break-word;
                    word-break: break-all;
                    white-space: normal;
                    line-height: 24px;
                }

                .el-radio__inner {
                    border: 1px solid #999;
                }

                .el-radio__input {
                    flex: 0 0 auto;
                    margin-top: 3px;
                }

                .el-radio__label {
                    font-size: 18px;
                    display: block;
                    flex: 1;
                    padding-left: 8px;
                    text-align: left;
                    white-space: normal;
                    line-height: 24px;
                }

                .el-checkbox__input {
                    flex: 0 0 auto;
                    margin-top: 3px;

                    .el-checkbox__inner {
                        border: 1px solid #999;
                    }
                }

                .el-checkbox__label {
                    font-size: 18px;
                    display: block;
                    flex: 1;
                    padding-left: 8px;
                    text-align: left;
                    white-space: normal;
                    line-height: 24px;
                }

                .copyable-text {
                    display: block;
                    text-align: left;
                    white-space: normal;
                    word-break: break-word;
                    line-height: 24px;
                }
            }
        }

        .trueAnswer {
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
                margin-left: 20px;
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
</style>
