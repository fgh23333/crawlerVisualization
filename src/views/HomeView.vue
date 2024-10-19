<template>
  <div id="home">
    <modal></modal>
    <el-container>
      <el-header>
        <navMenu></navMenu>
      </el-header>
      <el-main>
        <router-view></router-view>
      </el-main>
    </el-container>
  </div>
</template>

<script>
import navMenu from "@/components/navMenu.vue";
import modal from "@/components/modal.vue";

export default {
  name: 'HomeView',
  components: {
    navMenu,
    modal
  }
}
</script>

<style lang="less">
#home {
  .el-header {
    background-color: #B3C0D1;
    color: #333;
    text-align: center;
    line-height: 60px;
    padding: 0;
  }

  .el-main {
    background-color: #E9EEF3;
    color: #333;
    text-align: center;
    height: calc(100vh - 60px);
    padding: 0;
  }
}
</style>
