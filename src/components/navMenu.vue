<template>
    <div id="navMenu">
        <el-menu class="el-menu-vertical-demo" mode="horizontal">
            <el-submenu index="political">
                <template slot="title" class="title">思政</template>
                <el-menu-item v-for="(item, i) in 8" :key="i">
                    <router-link :to="'/examPage/' + 'political/' + i">试卷{{ i }}</router-link>
                </el-menu-item>
            </el-submenu>
            <el-submenu index="introduction">
                <template slot="title" class="title">习概</template>
                <el-menu-item v-for="(item, i) in 8" :key="i">
                    <router-link :to="'/examPage/' + 'introduction/' + index" v-for="(item, index) in 9" :key="index">
                        试卷{{ index }}
                    </router-link>
                </el-menu-item>
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
    text-decoration: none;

    a {
        color: black;
    }

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