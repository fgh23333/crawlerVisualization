<template>
    <div id="navMenu">
        <el-menu class="el-menu-vertical-demo" mode="horizontal" :router="true">
            <el-submenu index="political">
                <template slot="title" class="title">思政试卷</template>
                <el-menu-item v-for="(item, i) in 8" :key="i">
                    <router-link :to="'/examPage/' + 'political/' + i" style="color: black;">试卷{{ i }}</router-link>
                </el-menu-item>
            </el-submenu>
            <el-submenu index="introduction">
                <template slot="title" class="title">习概试卷</template>
                <el-menu-item v-for="(item, index) in 9" :key="index">
                    <router-link :to="'/examPage/' + 'introduction/' + index" style="color: black;">
                        试卷{{ index }}
                    </router-link>
                </el-menu-item>
            </el-submenu>
            <el-menu-item index="political">思政题库</el-menu-item>
            <el-menu-item index="introduction">习概题库</el-menu-item>
            <!-- :collapse="activeMenu !== 'political' + i" -->
            <!-- :collapse="activeMenu !== 'introduction' + index" -->
        </el-menu>
    </div>
</template>

<script>
export default {

}
</script>

<style lang="less">
#navMenu {
    text-decoration: none;

    .el-menu {
        margin: auto 0;
    }

    .el-menu--horizontal>.el-submenu.is-active .el-submenu__title {
        border-bottom: none;
    }

    .el-menu--horizontal>.el-submenu .el-submenu__title {
        border-bottom: none;
    }
}
</style>