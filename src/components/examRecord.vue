<template>
    <div id="examRecord">
        <div class="question-container">
            <div v-for="(questions, type) in questionTypes" :key="type">
                <div class="typeTitle">{{ typeLabels[type] }}</div>
                <div class="question-grid">
                    <span class="answer-status" :class="status[findQuestionIndex(question.id)]"
                        v-for="(question, index) in questions" :key="index">
                        {{ findQuestionIndex(question.id) + 1 }}
                    </span>
                </div>
            </div>
            <el-button type="primary" class="submit-btn" @click="submitAnswer">提交</el-button>
        </div>
    </div>
</template>

<script>
import { useQuestionStore } from '@/stores/question'
import { ElMessageBox } from 'element-plus'

export default {
    setup() {
        return { store: useQuestionStore() }
    },
    props: {
        autoSave: {
            type: Boolean,
            default: true
        }
    },
    data() {
        return {
            status: [],
            length: '',
            submitted: false
        }
    },
    computed: {
        questionTypes() {
            return {
                singleChoice: this.store.getQuestionsByType('singleChoice'),
                multipleChoice: this.store.getQuestionsByType('multipleChoice'),
                trueOrFalse: this.store.getQuestionsByType('trueOrFalse'),
                fillInTheBlank: this.store.getQuestionsByType('fillInTheBlank'),
            };
        },
        typeLabels() {
            return {
                singleChoice: '单选题',
                multipleChoice: '多选题',
                trueOrFalse: '判断题',
                fillInTheBlank: '填空题'
            };
        },
        findQuestionIndex() {
            return (id) => {
                return this.store.questionBank.findIndex(question => question.id === id);
            };
        },
        getAnswerStatus() {
            return (index) => {
                return this.store.answerList[index];
            };
        }
    },
    watch: {
        'store.answerList': {
            handler(newValue, oldValue) {
                // Don't repaint status after submission. `submitted` flips first
                // (in confirmAndSubmit), `store.score` is a longer-lived backup
                // that survives component re-creation.
                if (this.submitted || (this.store.score !== null && this.store.score !== undefined)) {
                    return
                }
                if (newValue === '' || !newValue) {
                    return
                }
                this.status = this.buildAnswerStatus(newValue)
            },
            deep: true
        },
        'store.score': {
            async handler(newValue, oldValue) {
                const results = this.store.results
                if (newValue == null) {
                    return
                } else if (newValue == this.length) {
                    this.status = new Array(this.length).fill('true')
                    ElMessageBox.alert(`得分为${newValue}，恭喜获得满分`, '提交成功', {
                        confirmButtonText: '确定',
                    });
                } else {
                    const nextStatus = new Array(this.length).fill('false')
                    await results.map(item => {
                        if (item.isCorrect) {
                            nextStatus[this.findQuestionIndex(item.questionId)] = 'true'
                        } else {
                            nextStatus[this.findQuestionIndex(item.questionId)] = 'false'
                        }
                    })
                    this.status = nextStatus
                    if (this.autoSave) {
                        ElMessageBox.alert(`得分为${newValue}，错题已推送至错题本`, '提交成功', {
                            confirmButtonText: '确定',
                        });
                    } else {
                        ElMessageBox.alert(`得分为${newValue}`, '提交成功', {
                            confirmButtonText: '确定',
                        });
                    }
                }
            }
        }
    },
    methods: {
        isAnswered(answer) {
            if (Array.isArray(answer)) {
                return answer.length > 0
            }
            return answer !== undefined && answer !== null && String(answer).trim() !== ''
        },
        buildAnswerStatus(answerList) {
            return this.store.questionBank.map((question, index) => {
                return this.isAnswered(answerList[index]) ? 'active' : 'unactive'
            })
        },
        async confirmAndSubmit(message, type) {
            try {
                await ElMessageBox.confirm(message, '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type
                })
                this.submitted = true
                await this.store.checkAnswer(this.autoSave)
                this.$emit('examStatus', true)
            } catch (e) {
                return
            }
        },
        async submitAnswer() {
            if (this.status.includes('unactive')) {
                this.confirmAndSubmit('还有未做的题目，确定提交吗？', 'warning')
            } else {
                this.confirmAndSubmit('确认提交吗？', 'info')
            }
        }
    },
    created() {
        const length = this.questionTypes.fillInTheBlank.length + this.questionTypes.multipleChoice.length + this.questionTypes.singleChoice.length + this.questionTypes.trueOrFalse.length
        this.length = length
        this.submitted = false
        this.store.answerList = this.store.questionBank.map(question => {
            return question.option && question.option.length > 2 && question.answer.length > 1 ? [] : ''
        })
        this.status = new Array(length).fill('unactive')
    }
};
</script>

<style lang="scss">
#examRecord::-webkit-scrollbar {
    display: none;
    /* 隐藏滚动条 */
}

#examRecord {
    background-color: #FFFFFF;
    padding: 20px;
    margin: 15px 0;
    border-radius: 20px;
    border: 1px solid #e0dcf2;
    box-shadow:
        0px -1px 8px 0px rgba(230, 232, 240, 0.9),
        -1px 0px 8px 0px rgba(230, 232, 240, 0.9),
        1px 0px 8px 0px rgba(230, 232, 240, 0.9),
        0px 1px 8px 0px rgba(230, 232, 240, 0.9);
    font-family: HarmonyOS Sans SC;
    overflow: auto;
    height: calc(100vh - 180px);
    scrollbar-width: none;
    -ms-overflow-style: none;

    .question-container {
        .typeTitle {
            text-align: left;
            color: #877bd1;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 18px;
        }

        .question-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, 28px);
            gap: 10px;
            margin-bottom: 20px;
            justify-content: space-between;

            .answer-status {
                width: 28px;
                height: 28px;

                font-weight: bold;
                line-height: 28px;
                border-radius: 8px;
                font-size: 18px;
                text-align: center;
            }

            .unactive {
                border: 3px solid #5F89D3;
                color: #5F89D3;
            }

            .active {
                border: 3px solid #5F89D3;
                background-color: #5F89D3;
                color: #fff;
            }

            .true {
                border: 3px solid #ABFF9E;
                background-color: #ABFF9E;
                color: #787878;
            }

            .false {
                border: 3px solid #FFA1A1;
                background-color: #FFA1A1;
                color: #787878;
            }
        }
    }

    .submit-btn {
        display: block;
        margin: 20px auto;
    }
}
</style>
