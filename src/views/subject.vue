<template>
    <div id="subject">
        <el-table :data="table" :stripe="true" style="width: 100%" height="100%" :header-fixed="true"
            :row-class-name="tableRowClassName">
            <el-table-column type="index" width="80" :fixed="true">
            </el-table-column>
            <el-table-column label="收藏" width="70" :fixed="true">
                <template #default="scope">
                    <el-icon :size="20" :color="isLiked(scope.row) ? '#e6a23c' : '#c0c4cc'" style="cursor: pointer"
                        @click="toggleLike(scope.row)">
                        <Star />
                    </el-icon>
                </template>
            </el-table-column>
            <el-table-column prop="questionStem" label="题干" width="400">
            </el-table-column>
            <el-table-column prop="option[0]" label="选项A">
            </el-table-column>
            <el-table-column prop="option[1]" label="选项B">
            </el-table-column>
            <el-table-column prop="option[2]" label="选项C">
            </el-table-column>
            <el-table-column prop="option[3]" label="选项D">
            </el-table-column>
            <el-table-column prop="option[4]" label="选项E">
            </el-table-column>
            <el-table-column prop="answer" label="答案" width="80">
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
            table: []
        }
    },
    setup() { return { store: useQuestionStore() } },
    created() {
        this.updateTable();
    },
    watch: {
        '$route.params.lesson': {
            handler: 'updateTable',
            immediate: true
        }
    },
    methods: {
        async updateTable() {
            let src = this.$route.params.lesson;
            this.table = await loadQuestionBank(src, 'subject');
        },
        tableRowClassName({ row, rowIndex }) {
            return rowIndex % 2 == 0 ? 'success-row' : '';
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
#subject {
    overflow: hidden;
    height: calc(100vh - 60px);

    .el-table {
        height: 100%;
    }

    .el-table .success-row {
        background: #f0f9eb;
    }
}
</style>
