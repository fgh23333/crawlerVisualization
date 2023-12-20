<template>
  <div id="home">
    <el-container>
      <el-aside width="200px">
        <navMenu></navMenu>
      </el-aside>
      <el-main>
        <router-view></router-view>
      </el-main>
    </el-container>
  </div>
</template>

<script>
import navMenu from "@/components/navMenu.vue";

export default {
  name: 'HomeView',
  components: {
    navMenu
  }
}
</script>

<style lang="less">
#home {
  .el-aside {
    background-color: #D3DCE6;
    color: #333;
    text-align: center;
    height: 100vh;
    padding: 0;
  }

  .el-main {
    background-color: #E9EEF3;
    color: #333;
    text-align: center;
    height: 100vh;
    padding: 0;
  }
}
</style>
