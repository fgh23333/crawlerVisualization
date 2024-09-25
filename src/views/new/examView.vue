<template>
    <div id="examView">
        <examCard v-for="(item, i) in questionList" :question="item" :key="i" :seq="i"></examCard>
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