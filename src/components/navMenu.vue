<template>
    <div id="navMenu">
        <el-menu class="el-menu-vertical-demo" mode="horizontal" :router="true">
            <el-submenu index="political">
                <template slot="title" class="title">思政试卷</template>
                <el-menu-item v-for="(item, i) in 9" :key="i">
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
            <el-menu-item class="list" index="/political">思政总题库</el-menu-item>
            <el-menu-item class="list" index="/introduction">习概总题库</el-menu-item>
            <el-menu-item class="list" index="/rightWrong/political">思政判断题</el-menu-item>
            <el-menu-item class="list" index="/rightWrong/introduction">习概判断题</el-menu-item>
            <el-menu-item class="list" index="/singleChoice/political">思政单选题</el-menu-item>
            <el-menu-item class="list" index="/singleChoice/introduction">习概单选题</el-menu-item>
            <el-menu-item class="list" index="/multipleChoice/political">思政多选题</el-menu-item>
            <el-menu-item class="list" index="/multipleChoice/introduction">习概多选题</el-menu-item>
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
    
    .el-submenu__title {
        background-color: #ECECC7;
    }

    .el-menu {
        margin: auto 0;

        .list {
            background-color: #E5E8E1;
        }
    }

    .el-menu--horizontal>.el-submenu.is-active .el-submenu__title {
        border-bottom: none;
    }

    .el-menu--horizontal>.el-submenu .el-submenu__title {
        border-bottom: none;
    }
}
</style>