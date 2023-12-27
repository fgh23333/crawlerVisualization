<template>
    <div id="mutipleChoice">
        <el-table :data="table" :stripe="true" style="width: 100%" height="100%" :header-fixed="true"
            :row-class-name="tableRowClassName">
            <el-table-column type="index" width="50" :fixed="true">
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
            table: [],
            lesson: ''
        }
    },
    created() {
        this.lesson = this.$route.params.lesson
        this.table = require(`../assets/${this.lesson}_mutipleChoice.json`)
    },
    watch: {
        '$route': function (to, from) {
            this.lesson = to.params.lesson
            this.table = require(`../assets/${this.lesson}_mutipleChoice.json`)
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
#singleChoice {
    .el-table .success-row {
        background: #f0f9eb;
    }

    .el-table .warning-row {
        background: oldlace;
    }
}
</style>