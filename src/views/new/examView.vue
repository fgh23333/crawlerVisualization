<template>
    <div id="examView">
        <el-row>
            <el-col :span="18">
                <div class="grid-content">
                    <examCard v-for="(item, i) in questionList" :question="item" :key="i" :seq="i"></examCard>
                </div>
            </el-col>
            <el-col :span="6">
                <div class="grid-content examRecord">
                    <examRecord></examRecord>
                </div>
            </el-col>
        </el-row>
    </div>
</template>

<script>
import examCard from '@/components/examCard.vue'
import examRecord from '@/components/examRecord.vue';
import { mapActions } from 'vuex';

export default {
    data() {
        return {
            questionList: []
        }
    },
    components: {
        examCard,
        examRecord
    },
    methods: {
        ...mapActions(['loadQuestionBank']),
        getQuestion() {
            this.loadQuestionBank(require('@/assets/cura/CCPH_1.json'))
        }
    },
    created() {
        this.getQuestion()
        this.questionList = this.$store.state.questionBank
    }
}
</script>

<style lang="less">
#examView {
    margin-right: 20px;

    .examRecord {
        position: fixed;
        width: 20%;
    }
}
</style>