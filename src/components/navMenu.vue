<template>
    <div id="navMenu">
        <el-menu class="el-menu-vertical-demo" :router="true" mode="horizontal">
            <el-submenu index="political">
                <template slot="title">思政</template>
                <el-menu-item index="1">试卷1</el-menu-item>
                <el-menu-item index="2">试卷2</el-menu-item>
                <el-menu-item index="3">试卷3</el-menu-item>
                <el-menu-item index="4">试卷4</el-menu-item>
                <el-menu-item index="5">试卷5</el-menu-item>
                <el-menu-item index="6">试卷6</el-menu-item>
                <el-menu-item index="7">试卷7</el-menu-item>
                <el-menu-item index="8">试卷8</el-menu-item>
            </el-submenu>
            <el-submenu index="introduction">
                <template slot="title">习概</template>
                <el-menu-item index="1">试卷1</el-menu-item>
                <el-menu-item index="2">试卷2</el-menu-item>
                <el-menu-item index="3">试卷3</el-menu-item>
                <el-menu-item index="4">试卷4</el-menu-item>
                <el-menu-item index="5">试卷5</el-menu-item>
                <el-menu-item index="6">试卷6</el-menu-item>
                <el-menu-item index="7">试卷7</el-menu-item>
                <el-menu-item index="8">试卷8</el-menu-item>
                <el-menu-item index="9">试卷9</el-menu-item>
            </el-submenu>
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