<template>
    <div id="navMenu">
        <el-menu class="el-menu-vertical-demo" mode="horizontal" :router="true">
            <el-submenu :index="'subject' + i" v-for="(item, i) in list" :key="i">
                <template slot="title" class="title">{{ list[i].subject }}</template>
                <el-menu-item>
                    <router-link :to="'/subject/' + item.src" style="color: black;">总题库</router-link>
                </el-menu-item>
                <!-- <el-menu-item>
                    <router-link :to="'/' + item.src" style="color: black;">判断题</router-link>
                </el-menu-item>
                <el-menu-item>
                    <router-link :to="'/' + item.src" style="color: black;">单选题</router-link>
                </el-menu-item>
                <el-menu-item>
                    <router-link :to="'/' + item.src" style="color: black;">多选题</router-link>
                </el-menu-item> -->
            </el-submenu>
        </el-menu>
    </div>
</template>

<script>
export default {
    data() {
        return {
            list: [
                {
                    subject: '马原',
                    src: 'Marx'
                },
                {
                    subject: '近代史',
                    src: 'CMH'
                },
                {
                    subject: '思政',
                    src: 'Political'
                },
                {
                    subject: '毛概',
                    src: 'MaoIntro'
                },
                {
                    subject: '习概',
                    src: 'XiIntro'
                },
                {
                    subject: '发展史',
                    src: 'SDH'
                },
                {
                    subject: '新中国史',
                    src: 'NCH'
                },
                {
                    subject: '党史',
                    src: 'CCPH'
                },
                {
                    subject: '开放史',
                    src: 'ORH'
                }
            ]
        }
    }
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