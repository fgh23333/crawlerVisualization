<template>
    <div id="examCard">
        <div class="left">
            <!-- <span class="seq">{{ i + 1 }}</span> -->
        </div>
        <div class="right">
            <div class="questionType">
                <span>{{ questionType }}</span>
            </div>
            <div class="questionStem">{{ question.questionStem }}</div>
            <div class="options" v-if="questionType !== '填空'">
                <div class="multiple" v-if="questionType == '多选'">
                    <el-checkbox-group v-model="checkList">
                        <el-checkbox v-for="(item, i) in question.option" :label="item" :key="i"></el-checkbox>
                    </el-checkbox-group>
                </div>
                <div class="single" v-else>
                    <el-radio v-model="radio" v-for="(item, i) in question.option" :key="i">{{ item }}</el-radio>
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
            checkList: '',
        }
    },
    props: {
        question: {
            type: Object,
            default: () => {
                return {}
            }
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
    }
}
</script>

<style lang="less">
#examCard {
    .left {}

    .right {}
}
</style>