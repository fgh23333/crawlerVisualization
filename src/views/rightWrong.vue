<template>
    <div id="rightWrong">
        <el-table :data="table" :stripe="true" style="width: 100%" height="100%" :header-fixed="true"
            :row-class-name="tableRowClassName">
            <el-table-column type="index" width="50" :fixed="true">
            </el-table-column>
            <el-table-column prop="questionStem" label="题干">
            </el-table-column>
            <el-table-column prop="answer" label="答案" width="100">
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
        let lesson = this.$route.params.lesson
        this.table = require(`../assets/${lesson}_right.json`)
        let temp = require(`../assets/${lesson}_wrong.json`)
        this.table.push(temp)
    },
    methods: {
        tableRowClassName({ row, rowIndex }) {
            if (lesson == 'political') {
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
        }
    },
}
</script>

<style lang="less">
#rightWrong {
    .el-table .success-row {
        background: #f0f9eb;
    }
}
</style>