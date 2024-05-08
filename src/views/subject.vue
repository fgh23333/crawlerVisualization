<template>
    <div id="subject">
        <el-table :data="table" :stripe="true" style="width: 100%" height="100%" :header-fixed="true"
            :row-class-name="tableRowClassName">
            <el-table-column type="index" width="80" :fixed="true">
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
export default {
    data() {
        return {
            table: []
        }
    },
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
        updateTable() {
            let src = this.$route.params.lesson;
            this.table = require(`../assets/${src}_Rewrite.json`);
        },
        tableRowClassName({ row, rowIndex }) {
            if (rowIndex % 2 == 0) {
                return 'success-row';
            } else {
                return '';
            }
        }
    },
}
</script>

<style lang="less">
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
