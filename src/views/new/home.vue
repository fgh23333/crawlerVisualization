<template>
    <div id="home">
        <el-container>
            <el-aside width="262px">
                <div class="title">
                    <img src="@/assets/icon/icon1.png" class="icon">
                    <div class="titleCover">
                        <span class="bigTitle">马院题库</span>
                        <span class="smallTitle">上海海洋大学</span>
                    </div>
                </div>
                <el-menu class="el-menu-vertical-demo" :unique-opened="true" active-text-color="#8174D6">
                    <el-submenu index="1">
                        <template slot="title">
                            <span>马原</span>
                        </template>
                        <el-menu-item-group>
                            <el-menu-item class="option" index="1-1">总题库</el-menu-item>
                            <el-menu-item class="option" index="1-2">判断题</el-menu-item>
                            <el-menu-item class="option" index="1-3">单选题</el-menu-item>
                            <el-menu-item class="option" index="1-4">多选题</el-menu-item>
                        </el-menu-item-group>
                    </el-submenu>
                    <el-submenu index="2">
                        <template slot="title">
                            <span>近代史</span>
                        </template>
                        <el-menu-item-group>
                            <el-menu-item class="option" index="2-1">总题库</el-menu-item>
                            <el-menu-item class="option" index="2-2">判断题</el-menu-item>
                            <el-menu-item class="option" index="2-3">单选题</el-menu-item>
                            <el-menu-item class="option" index="2-4">多选题</el-menu-item>
                        </el-menu-item-group>
                    </el-submenu>
                    <el-submenu index="3">
                        <template slot="title">
                            <span>思政</span>
                        </template>
                        <el-menu-item-group>
                            <el-menu-item class="option" index="3-1">总题库</el-menu-item>
                            <el-menu-item class="option" index="3-2">判断题</el-menu-item>
                            <el-menu-item class="option" index="3-3">单选题</el-menu-item>
                            <el-menu-item class="option" index="3-4">多选题</el-menu-item>
                        </el-menu-item-group>
                    </el-submenu>
                    <el-submenu index="4">
                        <template slot="title">
                            <span>毛概</span>
                        </template>
                        <el-menu-item-group>
                            <el-menu-item class="option" index="4-1">总题库</el-menu-item>
                            <el-menu-item class="option" index="4-2">判断题</el-menu-item>
                            <el-menu-item class="option" index="4-3">单选题</el-menu-item>
                            <el-menu-item class="option" index="4-4">多选题</el-menu-item>
                        </el-menu-item-group>
                    </el-submenu>
                </el-menu>
            </el-aside>
            <el-container>
                <el-main>
                    <router-view></router-view>
                </el-main>
            </el-container>
        </el-container>
    </div>
</template>

<script>
export default {

}
</script>

<style lang="less">
#home {
    .title {
        height: 72px;
        width: 222px;
        margin: 34px 20px;

        .icon {
            width: 72px;
            height: 72px;
            float: left;
        }

        .titleCover {
            height: 100%;
            width: 130px;
            padding: 10px 10px;
            float: left;
            text-align: left;
            letter-spacing: 3px;


            .bigTitle {
                color: #6C5DD3;
                font-weight: bold;
                font-size: 24px;
                line-height: 36px;
                float: left;
            }

            .smallTitle {
                font-weight: medium;
                color: #7A7A7A;
                font-size: 18px;
                float: left;
                line-height: 28px
            }
        }
    }

    .el-menu-vertical-demo {
        width: 216px;
        margin: 0px 23px;
        border: none;

        .el-submenu {
            margin: 20px 0px;

            .el-submenu__title {
                border-radius: 12px;
                background-color: #F7F7F7;
                font-size: 20px;
                font-weight: bold;
                color: #8F95B2;

            }
        }

        .option {
            font-size: 18px;
            color: #8F95B2;
        }

        .option:hover {
            background-color: white
        }
    }

    .is-active {
        background-color: white !important;
    }

    .el-main {
        background-color: #E9EEF3;
        color: #333;
        text-align: center;
        height: 100vh;
        padding: 0;
    }

    .el-aside {
        background-color: white;
        color: #333;
        text-align: center;
        line-height: 200px;
    }
}
</style>