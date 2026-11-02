<template>
    <div id="examRecord">
        <div class="question-container">
            <!-- 成绩单：提交判分后常驻显示（替代原先一闪而过的 alert 弹窗） -->
            <div class="result-card"
                v-if="submitted && store.score !== null && store.score !== undefined">
                <div class="score-line">
                    <span class="score-num" :class="{ full: store.score === length }">{{ store.score }}</span>
                    <span class="score-total">/ {{ length }}</span>
                </div>
                <div class="score-rate">正确率 {{ accuracyPct }}%</div>
                <div class="score-meta">
                    <span v-if="durationSeconds > 0">用时 {{ formattedDuration }}</span>
                    <span>{{ wrongCollectedText }}</span>
                </div>
                <div class="score-actions">
                    <el-button size="small" type="primary" @click="$router.push('/newHome/favorites')">复习错题</el-button>
                    <el-button size="small" @click="$router.push('/newHome/stats')">学习统计</el-button>
                </div>
            </div>
            <div class="question-grid">
                <span class="answer-status" :class="status[index]"
                    v-for="(question, index) in store.questionBank" :key="question.id">
                    {{ index + 1 }}
                </span>
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
        },
        // 整卷用时（秒），由 examView 传入；0 表示不展示
        durationSeconds: {
            type: Number,
            default: 0
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
        },
        // ── 成绩单展示 ──
        accuracyPct() {
            if (!this.length) return 0;
            return Math.round((this.store.score / this.length) * 100);
        },
        formattedDuration() {
            const m = Math.floor(this.durationSeconds / 60);
            const s = this.durationSeconds % 60;
            return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        },
        wrongCollectedText() {
            if (this.store.score === this.length) return '全部答对，无错题';
            const wrong = this.length - this.store.score;
            return this.autoSave
                ? `已收录 ${wrong} 道错题至错题本`
                : `错题 ${wrong} 道（错题收录已关闭）`;
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
                }
                // 成绩不再用一闪而过的弹窗：上方 result-card 常驻展示
                // 得分 / 正确率 / 用时 / 错题收录去向
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
        // 恢复未提交作答：视图层已把校验过的快照挂到 pendingRestore，
        // 题目已入 bank，这里只需按快照还原答案表与答题卡状态
        const restore = this.store.pendingRestore
        this.store.pendingRestore = null
        if (restore && Array.isArray(restore.answerList)
            && restore.answerList.length === this.store.questionBank.length) {
            this.store.answerList = [...restore.answerList]
            this.status = this.buildAnswerStatus(this.store.answerList)
        } else {
            this.store.answerList = this.store.questionBank.map(question => {
                return question.option && question.option.length > 2 && question.answer.length > 1 ? [] : ''
            })
            this.status = new Array(length).fill('unactive')
        }
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
    height: calc((100vh - 180px) / var(--app-zoom, 1));
    scrollbar-width: none;
    -ms-overflow-style: none;

    .question-container {
        // 成绩单卡片：提交后常驻，替代原 alert
        .result-card {
            border: 1px solid #e0dcf2;
            border-radius: 16px;
            background: #f7f6ff;
            padding: 18px 16px 14px;
            margin-bottom: 20px;

            .score-line {
                display: flex;
                align-items: baseline;
                justify-content: center;
                gap: 6px;

                .score-num {
                    font-size: 44px;
                    font-weight: bold;
                    color: #6C5DD3;
                    line-height: 1.1;

                    &.full {
                        color: #67C23A;
                    }
                }

                .score-total {
                    font-size: 18px;
                    color: #8F95B2;
                }
            }

            .score-rate {
                text-align: center;
                color: #5A5E70;
                font-size: 14px;
                font-weight: 600;
                margin-top: 2px;
            }

            .score-meta {
                display: flex;
                justify-content: center;
                flex-wrap: wrap;
                gap: 6px 14px;
                color: #8F95B2;
                font-size: 13px;
                margin-top: 10px;
            }

            .score-actions {
                display: flex;
                justify-content: center;
                gap: 10px;
                margin-top: 14px;
            }
        }

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
