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
                    <el-checkbox-group v-model="checkList" :disabled="examStatus" class="checkbox-group"
                        @change="updateOption(seq, checkList)">
                        <div v-for="(item, i) in question.option" class="answer">
                            <el-checkbox :label="options[i]" :key="i" class="option checkbox-item copyable-option">
                                <span class="copyable-text">{{ options[i] + '、' + item }}</span>
                            </el-checkbox>
                        </div>
                    </el-checkbox-group>
                </div>
                <div class="single" v-if="questionType == '判断' || questionType == '单选'">
                    <div v-for="(item, i) in question.option" :key="i" class="answer">
                        <el-radio v-model="radio" :disabled="examStatus"
                            :label="question.option.length == 2 ? item : options[i]" class="option copyable-option"
                            @change="updateOption(seq, radio)">
                            <span class="copyable-text">{{ options[i] + '、' + item }}</span>
                        </el-radio>
                    </div>
                </div>
                <div class="fillingBlank" v-if="questionType == '填空'">
                    <el-input class="copyable-option" v-model="input" :disabled="examStatus"
                        @change="updateOption(seq, input)" placeholder="请输入答案"></el-input>
                </div>
                <div class="trueAnswer" v-if="$store.state.answerList == ''">
                    <span class="colorBefore"></span>
                    <span class="answerStatus true"
                        v-if="$store.state.results[seq].questionId == question.id && $store.state.results[seq].isCorrect">回答正确</span>
                    <span class="answerStatus false"
                        v-if="$store.state.results[seq].questionId == question.id && !$store.state.results[seq].isCorrect">回答错误</span>
                    <span class="correctAnswer">正确答案：</span>
                    <span class="answer">{{ question.answer }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            radio: '',
            checkList: [],
            options: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'],
            input: ''
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
        }
    },
    methods: {
        updateOption(questionIndex, option) {
            this.$set(this.$store.state.answerList, questionIndex, option)
        },
    }
}
</script>

<style lang="less">
.checkbox-group {
    display: flex;
    flex-direction: column;
}

.checkbox-item {
    display: flex;
    align-items: flex-start;
    /* 确保复选框靠上对齐 */
    margin-bottom: 10px;
    /* 调整每个选项的间距 */
}

.el-checkbox {
    align-items: flex-start;
    /* 让复选框靠上对齐 */
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
                line-height: 30px;
                color: #5F89D3;

                span {
                    word-wrap: break-word;
                    word-break: break-all;
                    white-space: normal;
                    line-height: 22px;
                }

                .el-radio__inner {
                    border: 1px solid #999;
                }


                .el-radio__label {
                    font-size: 18px;
                    display: inline;
                }

                .el-checkbox__input {
                    margin-top: -2px;

                    .el-checkbox__inner {
                        border: 1px solid #999;
                    }
                }

                .el-checkbox__label {
                    font-size: 18px;
                    display: inline;
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