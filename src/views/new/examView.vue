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
                    {{ lesson }} - 试卷 {{ seq }}
                </div>
            </template>
            <template v-slot:right>
                <el-select v-model="value" :placeholder="paper">
                    <el-option v-for="item in paperOptions" :key="item.value" :label="item.label" :value="item.value">
                    </el-option>
                </el-select>
            </template>
        </topBar>
        <el-row>
            <el-col :span="18">
                <div class="grid-content">
                    <examCard v-for="(item, i) in questionList" :question="item" :key="i" :seq="i" :examStatus="examStatus"></examCard>
                </div>
            </el-col>
            <el-col :span="6">
                <div class="grid-content examRecord">
                    <examRecord @examStatus="disableOpts"></examRecord>
                </div>
            </el-col>
        </el-row>
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
            examStatus: false
        }
    },
    components: {
        examCard,
        examRecord,
        topBar
    },
    methods: {
        ...mapActions(['loadQuestionBank']),
        getQuestion(lesson) {
            this.loadQuestionBank(require(`@/assets/cura/${lesson}_${this.$route.params.id}.json`))
        },
        goBack() {
            this.$router.go(-1)
        },
        disableOpts(status) {
            this.examStatus = status
        }
    },
    watch: {
        value: function (newval, oldval) {
            this.$router.push({ path: '/newHome/exam/' + this.$route.params.lesson + '/' + newval })
            this.getQuestion(this.$route.params.lesson)
            this.questionList = this.$store.state.questionBank
            this.seq = this.$route.params.id
        },
        '$route': function (to, from) {
            this.getQuestion(this.$route.params.lesson)
            this.questionList = this.$store.state.questionBank
        }
    },
    created() {
        this.examStatus = false
        this.lesson = this.abbreviationSubjectList[this.$route.params.lesson]
        this.seq = this.$route.params.id
        this.paper = '试卷' + this.$route.params.id
        for (let i = 0; i < this.subjectList[this.$route.params.lesson].num; i++) {
            let temp = {
                value: i + 1,
                label: '试卷' + (i + 1)
            }
            this.paperOptions.push(temp)
        }
        const rest = {
            value: 'residual',
            label: '剩余题目'
        }
        this.paperOptions.push(rest)
        this.getQuestion(this.$route.params.lesson)
        this.questionList = this.$store.state.questionBank
        this.questionList.forEach(item => {
            const temp = {
                questionId: item.id,
                isCorrect: null
            }
            this.$store.state.results.push(temp)
        })
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
        width: 20%;
    }
}
</style>