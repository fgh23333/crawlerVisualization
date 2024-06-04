<template>
    <div id="topBar">
        <el-row>
            <el-col :span="8">
                <div class="grid-content bg-purple">
                    <slot name="left"></slot>
                </div>
            </el-col>
            <el-col :span="8">
                <div class="grid-content bg-purple-light">
                    <slot name="middle"></slot>
                </div>
            </el-col>
            <el-col :span="8">
                <div class="grid-content bg-purple">
                    <slot name="right"></slot>
                </div>
            </el-col>
        </el-row>
    </div>
</template>

<script>

export default {
    components: {
    },
    data() {
        return {

        }
    }
}
</script>

<style lang="less">
#topBar {
    .el-row {
        margin-bottom: 20px;

        &:last-child {
            margin-bottom: 0;
        }
    }

    .el-col {
        border-radius: 4px;
    }

    .bg-purple-dark {
        background: #99a9bf;
    }

    .bg-purple {
        background: #FAFBFF;
    }

    .bg-purple-light {
        background: #FAFBFF;
    }

    .grid-content {
        height: 60px;
        line-height: 60px;
        text-align: center;
    }

    .row-bg {
        padding: 10px 0;
        background-color: #f9fafc;
    }
}
</style>