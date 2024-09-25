<template>
    <div id="examView">
        <examCard v-for="(item, i) in questionList" :question="questionList[i]" :key="i"></examCard>
    </div>
</template>

<script>
import examCard from '@/components/examCard.vue'

export default {
    data() {
        return {
            questionList: []
        }
    },
    components: {
        examCard
    },
    created() {
        this.questionList = require(`@/assets/cura/CCPH_1.json`)
    }
}
</script>