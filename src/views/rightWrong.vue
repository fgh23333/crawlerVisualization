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
            table: [],
            lesson: ''
        }
    },
    created() {
        this.lesson = this.$route.params.lesson
        this.table = require(`../assets/${this.lesson}_rightWrong.json`)
    },
    watch: {
        '$route': function (to, from) {
            this.lesson = to.params.lesson
            this.table = require(`../assets/${this.lesson}_rightWrong.json`)
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
        }
    },
}
</script>

<style lang="less">
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