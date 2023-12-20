<template>
    <div id="navMenu">
        <el-menu class="el-menu-vertical-demo" :router="true">
            <el-menu-item index="political">
                <i class="el-icon-document"></i>
                <span slot="title">思政</span>
            </el-menu-item>
            <el-menu-item index="introduction">
                <i class="el-icon-document"></i>
                <span slot="title">习概</span>
            </el-menu-item>
        </el-menu>
    </div>
</template>

<script>
export default {

}
</script>

<style lang="less">
#navMenu {
    .el-col {
        width: 100%;
        
        .el-menu {
            margin: auto 0;
        }
    }
}
</style>