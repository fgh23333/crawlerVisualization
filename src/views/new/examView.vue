<template>
    <div id="examView">
        <topBar>
            <template v-slot:left>
                <div class="goBack">
                    <i class="el-icon-arrow-left" @click="goBack()"></i>
                </div>
            </template>
            <template v-slot:middle>
                <div class="paperTitle">
                    <span>{{ lesson }} - </span>
                    <span v-if="value !== 'random'">试卷 {{ seq }}</span>
                    <span v-else>随机练习</span>
                </div>
            </template>
            <template v-slot:right>
                <div class="top-controls">
                    <el-switch v-model="autoSave" active-text="错题收录" inactive-text="" active-color="#6C5DD3">
                    </el-switch>
                    <el-select v-model="value" :placeholder="paper" style="width: 120px;">
                        <el-option v-for="item in paperOptions" :key="item.value" :label="item.label"
                            :value="item.value">
                        </el-option>
                    </el-select>
                </div>
            </template>
        </topBar>
        <el-row v-if="questionList.length > 0">
            <el-col :span="18">
                <div class="grid-content">
                    <examCard v-for="(item, i) in questionList" :question="item" :key="item.id" :seq="i"
                        :examStatus="examStatus">
                    </examCard>
                </div>
            </el-col>
            <el-col :span="6">
                <div class="grid-content examRecord">
                    <examRecord @examStatus="disableOpts" :autoSave="autoSave" :key="$route.fullPath"></examRecord>
                </div>
            </el-col>
        </el-row>
        <div v-else class="loading-placeholder">
            <el-empty description="加载中..."></el-empty>
        </div>
    </div>
</template>

<script>
import examCard from '@/components/examCard.vue'
import examRecord from '@/components/examRecord.vue';
import topBar from '@/components/topBar.vue';
import { mapActions } from 'vuex';

export default {
    data() {
        return {
            questionList: [],
            paper: '',
            subjectList: {
                'Marx': {
                    name: '马克思主义基本原理',
                    num: 8
                },
                'XiIntro': {
                    name: '习近平新时代中国特色社会主义思想概论',
                    num: 8
                },
                'CMH': {
                    name: '中国近现代史纲要',
                    num: 14
                },
                'Political': {
                    name: '思想道德与法治',
                    num: 11
                },
                'MaoIntro': {
                    name: '毛泽东思想和中国特色社会主义理论体系概论',
                    num: 11
                },
                'CCPH': {
                    name: '中国共产党历史',
                    num: 6
                },
                'ORH': {
                    name: '改革开放史',
                    num: 8
                },
                'SDH': {
                    name: '社会主义发展史',
                    num: 6
                },
                'NCH': {
                    name: '新中国史',
                    num: 5
                }
            },
            abbreviationSubjectList: {
                'Marx': '马原',
                'CMH': '近代史',
                'Political': '思政',
                'MaoIntro': '毛概',
                'XiIntro': '习概',
                'SDH': '社主史',
                'NCH': '新中国史',
                'CCPH': '党史',
                'ORH': '改开史'
            },
            paperOptions: [],
            lesson: '',
            seq: '',
            value: '',
            examStatus: false,
            newSubject: ['Marx', 'XiIntro', 'CMH', 'Political', 'MaoIntro'],
            autoSave: true
        }
    },
    components: {
        examCard,
        examRecord,
        topBar
    },
    methods: {
        ...mapActions(['loadQuestionBank', 'generateQuiz']),
        getQuestion(lesson, id) {
            const paperId = id || this.$route.params.id;
            this.loadQuestionBank(require(`@/assets/cura/${lesson}_${paperId}.json`))
        },
        goBack() {
            this.$router.go(-1)
        },
        disableOpts(status) {
            this.examStatus = status
        },
        async getQuiz(type, lesson) {
            if (type) {
                await this.generateQuiz([lesson, {
                    single: 20, // 单选题数量
                    multiple: 15, // 多选题数量
                    blank: 10, // 填空题数量
                    trueFalse: 15 // 判断题数量
                }]);
            } else {
                await this.generateQuiz([lesson, {
                    single: 15, // 单选题数量
                    multiple: 15, // 多选题数量
                    blank: 5, // 填空题数量
                    trueFalse: 15 // 判断题数量
                }]);
            }
        }
    },
    watch: {
        value: function (newval, oldval) {
            if (newval && newval.toString() !== this.$route.params.id.toString()) {
                this.$router.push({ path: '/newHome/exam/' + this.$route.params.lesson + '/' + newval })
            }
        },
        '$route': async function (to, from) {
            if (to.path === from.path) return;
            await this.initExam(to);
        }
    },
    async created() {
        await this.initExam(this.$route);
    },
    methods: {
        ...mapActions(['loadQuestionBank', 'generateQuiz']),
        getQuestion(lesson, id) {
            const paperId = id || this.$route.params.id;
            try {
                this.loadQuestionBank(require(`@/assets/cura/${lesson}_${paperId}.json`))
            } catch (e) {
                console.error("Failed to load question bank:", e);
                this.loadQuestionBank([]);
            }
        },
        goBack() {
            this.$router.go(-1)
        },
        disableOpts(status) {
            this.examStatus = status
        },
        async getQuiz(type, lesson) {
            if (type) {
                await this.generateQuiz([lesson, {
                    single: 20, // 单选题数量
                    multiple: 15, // 多选题数量
                    blank: 10, // 填空题数量
                    trueFalse: 15 // 判断题数量
                }]);
            } else {
                await this.generateQuiz([lesson, {
                    single: 15, // 单选题数量
                    multiple: 15, // 多选题数量
                    blank: 5, // 填空题数量
                    trueFalse: 15 // 判断题数量
                }]);
            }
        },
        async initExam(route) {
            // Reset answer list and status
            this.$store.state.answerList = [];
            this.$store.state.results = [];
            this.examStatus = false;

            const lesson = route.params.lesson;
            const id = route.params.id;

            // Sync value with route
            if (id === 'random') {
                this.value = 'random';
                this.paper = '随机练习';
            } else {
                this.value = parseInt(id);
                this.paper = '试卷' + id;
            }

            this.lesson = this.abbreviationSubjectList[lesson];
            this.seq = id;

            // Initialize paper options if not set or subject changed
            // Actually, best to rebuild to be safe
            this.paperOptions = [];
            for (let i = 0; i < this.subjectList[lesson].num; i++) {
                let temp = {
                    value: i + 1,
                    label: '试卷' + (i + 1)
                }
                this.paperOptions.push(temp)
            }
            const rest = {
                value: 'random',
                label: '随机练习'
            }
            this.paperOptions.push(rest)

            // Load questions
            if (id === 'random') {
                await this.getQuiz(this.newSubject.some(element => element == lesson), lesson)
            } else {
                this.getQuestion(lesson, id)
            }

            this.questionList = this.$store.state.questionBank;

            // Initialize results for the new question list
            if (this.questionList) {
                this.questionList.forEach(item => {
                    const temp = {
                        questionId: item.id,
                        isCorrect: null
                    }
                    this.$store.state.results.push(temp)
                })
            }
        }
    }
}
</script>

<style lang="less">
#examView {
    margin-right: 20px;

    .goBack {
        text-align: left;
        font-size: 32px;
        margin: 0 50px;

        .el-icon-arrow-left {
            border: 3px solid #333;
            border-radius: 50%;
        }
    }

    .examRecord {
        position: fixed;
        width: calc(20% - 20px);
    }

    .loading-placeholder {
        padding-top: 100px;
    }

    .top-controls {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        padding-right: 20px;

        .el-switch {
            margin-right: 15px;
        }
    }
}
</style>
