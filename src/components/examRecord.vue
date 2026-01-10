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
import { mapGetters, mapActions } from 'vuex';

export default {
    props: {
        autoSave: {
            type: Boolean,
            default: true
        }
    },
    data() {
        return {
            status: [],
            length: ''
        }
    },
    computed: {
        ...mapGetters(['getAllQuestions', 'getQuestionsByType']),

        questionTypes() {
            return {
                singleChoice: this.getQuestionsByType('singleChoice'),
                multipleChoice: this.getQuestionsByType('multipleChoice'),
                trueOrFalse: this.getQuestionsByType('trueOrFalse'),
                fillInTheBlank: this.getQuestionsByType('fillInTheBlank'),
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
                return this.getAllQuestions.findIndex(question => question.id === id);
            };
        },
        getAnswerStatus() {
            return (index) => {
                return this.$store.state.answerList[index];
            };
        }
    },
    watch: {
        '$store.state.answerList': {
            handler(newValue, oldValue) {
                if (newValue === '') {
                    return
                } else {
                    this.status = newValue.map(item => {
                        if (!(Array.isArray(item) && item.length === 0) && item !== undefined && item !== null && item !== '') {
                            return 'active'
                        } else {
                            return 'unactive'
                        }
                    })
                }
            },
            deep: true
        },
        '$store.state.score': {
            async handler(newValue, oldValue) {
                const results = this.$store.state.results
                if (newValue == null) {
                    return
                } else if (newValue == this.length) {
                    this.status = new Array(this.length).fill('true')
                    this.$alert(`得分为${newValue}，恭喜获得满分`, '提交成功', {
                        confirmButtonText: '确定',
                    });
                } else {
                    await results.map(item => {
                        if (item.isCorrect) {
                            this.status[this.findQuestionIndex(item.questionId)] = 'true'
                        } else {
                            this.status[this.findQuestionIndex(item.questionId)] = 'false'
                        }
                    })
                    if (this.autoSave) {
                        this.$alert(`得分为${newValue}，错题已推送至收藏夹`, '提交成功', {
                            confirmButtonText: '确定',
                        });
                    } else {
                        this.$alert(`得分为${newValue}`, '提交成功', {
                            confirmButtonText: '确定',
                        });
                    }
                }
            }
        }
    },
    methods: {
        ...mapActions(['checkAnswer']),
        async submitAnswer() {
            if (this.status.includes(false)) {
                this.$confirm('还有未做的题目，确定提交吗？', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                }).then(() => {
                    this.checkAnswer(this.autoSave)
                    this.$emit('examStatus', true)
                }).catch(() => {
                    return
                });
            } else {
                this.$confirm('确认提交吗？', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'info'
                }).then(() => {
                    this.checkAnswer(this.autoSave)
                    this.$emit('examStatus', true)
                }).catch(() => {
                    return
                });
            }
        }
    },
    created() {
        const length = this.questionTypes.fillInTheBlank.length + this.questionTypes.multipleChoice.length + this.questionTypes.singleChoice.length + this.questionTypes.trueOrFalse.length
        this.length = length
        this.$store.state.answerList = new Array(length).fill('')
        this.status = new Array(length).fill('unactive')
    }
};
</script>

<style lang="less">
#examRecord::-webkit-scrollbar {
    display: none;
    /* 隐藏滚动条 */
}

#examRecord {
    background-color: #FFFFFF;
    padding: 20px;
    margin: 15px 0;
    border-radius: 20px;
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
