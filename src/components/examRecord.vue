<template>
    <div id="examRecord">
        <div class="question-container">
            <div v-for="(questions, type) in questionTypes" :key="type">
                <div class="typeTitle">{{ typeLabels[type] }}</div>
                <div class="question-grid">
                    <span class="answer-status" :class="status[findQuestionIndex(question.id)] ? 'active' : 'unactive'"
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
    data() {
        return {
            status: []
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
                this.status = newValue.map(item => {
                    // 检查是否为数组且长度为0，或者是null、undefined或空字符串
                    return !(Array.isArray(item) && item.length === 0) && item !== undefined && item !== null && item !== '';
                });
            },
            deep: true
        },
        '$store.state.score': {
            handler(newValue, oldValue) {
                if (newValue == null) {
                    this.$message({
                        type: 'success',
                        message: `提交成功，得分为${newValue}`
                    })
                } else {
                    return
                }
            }
        }
    },
    methods: {
        ...mapActions(['checkAnswer']),
        async submitAnswer() {
            this.checkAnswer()
        }
    },
    created() {
        this.status = new Array(this.questionTypes.length).fill(false)
    }
};
</script>

<style lang="less">
#examRecord {
    background-color: #FFFFFF;
    padding: 24px;
    margin: 15px 0;
    border-radius: 24px;
    box-shadow:
        0px -1px 8px 0px rgba(230, 232, 240, 0.9),
        -1px 0px 8px 0px rgba(230, 232, 240, 0.9),
        1px 0px 8px 0px rgba(230, 232, 240, 0.9),
        0px 1px 8px 0px rgba(230, 232, 240, 0.9);
    font-family: HarmonyOS Sans SC;

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
                border: 3px solid #5F89D3;
                font-weight: bold;
                line-height: 28px;
                border-radius: 8px;
                font-size: 18px;
                text-align: center;
            }

            .unactive {
                color: #5F89D3;
            }

            .active {
                background-color: #5F89D3;
                color: #fff;
            }
        }
    }

    .submit-btn {
        display: block;
        margin: 20px auto;
    }
}
</style>