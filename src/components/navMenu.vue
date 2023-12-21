<template>
    <div id="navMenu">
        <el-menu class="el-menu-vertical-demo" :router="true" mode="horizontal">
            <el-menu-item index="political">思政</el-menu-item>
            <el-menu-item index="introduction">习概</el-menu-item>
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