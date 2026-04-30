<template>
    <div id="navMenu">
        <el-menu class="el-menu-vertical-demo" mode="horizontal" :router="true">
            <el-sub-menu :index="'subject' + i" v-for="(item, i) in list" :key="i">
                <template #title><span class="title">{{ list[i].subject }}</span></template>
                <el-menu-item>
                    <router-link :to="'/subject/' + item.src" style="color: black;">总题库</router-link>
                </el-menu-item>
                <el-menu-item>
                    <router-link :to="'/rightWrong/' + item.src" style="color: black;">判断题</router-link>
                </el-menu-item>
                <el-menu-item>
                    <router-link :to="'/singleChoice/' + item.src" style="color: black;">单选题</router-link>
                </el-menu-item>
                <el-menu-item>
                    <router-link :to="'/multipleChoice/' + item.src" style="color: black;">多选题</router-link>
                </el-menu-item>
                <el-menu-item v-if="newSubject.includes(item.src)">
                    <router-link :to="'/fillingBlank/' + item.src" style="color: black;">填空题</router-link>
                </el-menu-item>
            </el-sub-menu>
            <div class="newVer">
                <router-link to="/favorites" style="margin-right: 10px;">
                    <el-button>收藏夹</el-button>
                </router-link>
                <el-button @click="goToNewHome">点击体验新版</el-button>
            </div>
        </el-menu>
    </div>
</template>

<script>
export default {
    data() {
        return {
            newSubject: ['Marx', 'XiIntro', 'CMH', 'Political', 'MaoIntro', 'CCPH', 'SDH'],
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
                    subject: '社主史',
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
                    subject: '改开史',
                    src: 'ORH'
                }
            ]
        }
    },
  methods:{
      goToNewHome(){
          this.$router.push('/newHome')
      }
  }
}
</script>

<style lang="scss">
#navMenu {
    text-decoration: none;

    .newVer {
        color: black;
      text-align: left;
      .el-button {
          margin-left: 20px;
      }
    }

    .el-sub-menu__title {
        background-color: #ECECC7;
    }

    .el-menu {
        margin: auto 0;

        .list {
            background-color: #E5E8E1;
        }
    }

    .el-menu--horizontal>.el-sub-menu.is-active .el-sub-menu__title {
        border-bottom: none;
    }

    .el-menu--horizontal>.el-sub-menu .el-sub-menu__title {
        border-bottom: none;
    }
}
</style>