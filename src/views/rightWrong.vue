<template>
    <div id="rightWrong">
        <el-table :data="table" :stripe="true" style="width: 100%" height="100%" :header-fixed="true"
            :row-class-name="tableRowClassName">
            <el-table-column type="index" width="50" :fixed="true">
            </el-table-column>
            <el-table-column label="收藏" width="70" :fixed="true">
                <template #default="scope">
                    <el-icon :size="20" :color="isLiked(scope.row) ? '#e6a23c' : '#c0c4cc'" style="cursor: pointer"
                        @click="toggleLike(scope.row)">
                        <Star />
                    </el-icon>
                </template>
            </el-table-column>
            <el-table-column prop="questionStem" label="题干">
            </el-table-column>
            <el-table-column prop="answer" label="答案" width="100">
            </el-table-column>
        </el-table>
    </div>
</template>

<script>
import { useQuestionStore } from '@/stores/question';
import { loadQuestionBank } from '@/utils/loadJson';

export default {
    data() {
        return {
            table: [],
            lesson: ''
        }
    },
    setup() { return { store: useQuestionStore() } },
    async created() {
        this.lesson = this.$route.params.lesson
        this.table = await loadQuestionBank(this.lesson, 'rightWrong')
    },
    watch: {
        '$route': async function (to, from) {
            this.lesson = to.params.lesson
            this.table = await loadQuestionBank(this.lesson, 'rightWrong')
        }
    },
    methods: {
        tableRowClassName({ row, rowIndex }) {
            if (this.lesson == 'political') {
                if (rowIndex % 2 == 0) {
                    return 'success-row';
                } else {
                    return '';
                }
            } else {
                if (rowIndex % 2 == 0) {
                    return 'warning-row';
                } else {
                    return '';
                }
            }
        },
        isLiked(row) {
            return this.store.likeList.some(q => q.id === row.id);
        },
        toggleLike(row) {
            if (this.isLiked(row)) {
                this.store.removeLikeQuestion(row.id);
            } else {
                row.likeFlag = true;
                this.store.addLikeQuestion(row);
            }
        }
    },
}
</script>

<style lang="scss">
#rightWrong {
    overflow: hidden;
    height: calc(100vh - 60px);

    .el-table {
        height: 100%;
    }

    .el-table .success-row {
        background: #f0f9eb;
    }

    .el-table .warning-row {
        background: oldlace;
    }
}
</style>