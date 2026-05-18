<template>
  <div id="ncre3Home">
    <el-container>
      <el-aside :width="isCollapsed ? '0px' : '262px'" class="sidebar" :class="{ 'is-collapsed': isCollapsed }">
        <div class="sidebar-content">
          <router-link to="/ncre3" class="logo-link">
            <div class="title">
              <div class="icon-wrapper">
                <el-icon :size="32" color="#6C5DD3"><Monitor /></el-icon>
              </div>
              <div class="titleCover">
                <span class="bigTitle">计算机三级题库</span>
                <span class="smallTitle">实操答案专区</span>
              </div>
            </div>
          </router-link>

          <div class="nav">
            <el-menu class="el-menu-vertical-demo" :unique-opened="true" active-text-color="#8174D6" :router="true">
              <el-sub-menu v-for="cat in categories" :key="cat.key" :index="cat.key">
                <template #title>
                  <el-icon><component :is="cat.icon" /></el-icon>
                  <span>{{ cat.label }}</span>
                </template>
                <el-menu-item-group>
                  <el-menu-item
                    v-for="sub in cat.subItems"
                    :key="sub.key"
                    :index="`/ncre3/${cat.key}${sub.key ? '_' + sub.key : ''}`"
                    class="option"
                  >
                    {{ sub.label }}
                  </el-menu-item>
                </el-menu-item-group>
              </el-sub-menu>
            </el-menu>
          </div>

          <div class="buttonContainer">
            <router-link to="/ncre3/favorites">
              <div class="tab">
                <el-icon class="btn-icon" :size="24"><Star /></el-icon>
                <div class="text">收藏夹</div>
              </div>
            </router-link>
            <router-link to="/newHome">
              <div class="tab">
                <el-icon class="btn-icon" :size="24"><Back /></el-icon>
                <div class="text">思政题库</div>
              </div>
            </router-link>
          </div>
        </div>
      </el-aside>

      <div class="toggle-bar" @click="isCollapsed = !isCollapsed">
        <span class="arrow" :class="{ right: !isCollapsed }"></span>
      </div>

      <el-container>
        <el-main>
          <router-view></router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Monitor, Star, Back, Coin, Cpu, Edit, Connection, DataAnalysis } from '@element-plus/icons-vue'

const isCollapsed = ref(false)

const categories = [
  {
    key: 'sql',
    label: 'SQL 数据库题',
    icon: Coin,
    subItems: [
      { key: 'pet_221', label: 'PetStore 221' },
      { key: 'pet_222', label: 'PetStore 222' },
      { key: 'pet_223', label: 'PetStore 223' },
      { key: 'student_224', label: 'StudentDB 224' },
      { key: 'student_225', label: 'StudentDB 225' }
    ]
  },
  {
    key: 'java_network',
    label: 'Java 网络编程',
    icon: Connection,
    subItems: [
      { key: '', label: '全部网络编程题' }
    ]
  },
  {
    key: 'java_debug',
    label: 'Java 调试题',
    icon: Cpu,
    subItems: [
      { key: '', label: '全部调试题' }
    ]
  },
  {
    key: 'uml',
    label: 'UML 设计题',
    icon: Edit,
    subItems: [
      { key: '', label: '全部UML题' }
    ]
  },
  {
    key: 'software_testing',
    label: '软件测试题',
    icon: DataAnalysis,
    subItems: [
      { key: '', label: '全部测试题' }
    ]
  }
]
</script>

<style lang="scss" scoped>
#ncre3Home {
  .toggle-bar {
    width: 24px;
    cursor: pointer;
    height: 100vh;
    padding: 0 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    background-color: rgba(230, 232, 240, 0.4);
    transition: all 0.3s;

    &:hover {
      background-color: rgba(230, 232, 240, 0.8);
    }
  }

  .arrow {
    border: solid #bbb;
    border-width: 0 4px 4px 0;
    display: block;
    padding: 6px;
    transform: rotate(-45deg);
    transition: transform 0.3s ease;
  }

  .arrow.right {
    transform: rotate(135deg);
    margin-left: -4px;
  }

  :deep(.el-main) {
    background-color: #FAFBFF;
    height: 100vh;
    padding: 20px;
    overflow-y: auto;
  }

  .sidebar {
    transition: width 0.3s ease;
    overflow: hidden;
    height: 100vh;
    background-color: #fff;
    border-right: 1px solid #f0f0f0;
  }

  .sidebar-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 262px;
  }

  .title {
    height: 72px;
    margin: 34px 20px;
    display: flex;
    align-items: center;

    .icon-wrapper {
      width: 48px;
      height: 48px;
      background: #f0edfc;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .titleCover {
      margin-left: 10px;
      text-align: left;

      .bigTitle {
        display: block;
        color: #6C5DD3;
        font-weight: bold;
        font-size: 18px;
      }

      .smallTitle {
        display: block;
        font-size: 14px;
        color: #7A7A7A;
      }
    }
  }

  .nav {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;

    :deep(.el-menu-vertical-demo) {
      width: 216px;
      margin: 0 23px;
      border: none;

      .el-sub-menu {
        margin-bottom: 8px;
        border-radius: 12px;
        overflow: hidden;

        .el-sub-menu__title {
          border-radius: 12px;
          background-color: #F7F7F7;
          font-size: 15px;
          font-weight: bold;
          color: #8F95B2;
          height: 44px;
          line-height: 44px;
        }

        .el-sub-menu__title:hover {
          background-color: #6C5DD3;
          color: white;
        }
      }

      .is-opened > .el-sub-menu__title {
        background-color: #6C5DD3;
        color: white;
      }

      .option {
        font-size: 13px;
        color: #8F95B2;
        height: 36px;
        line-height: 36px;
        border-radius: 8px;
        margin-left: 10px;
        margin-bottom: 2px;
      }

      .is-active {
        background-color: #E6E4F4 !important;
        color: #6C5DD3 !important;
        font-weight: bold;
      }
    }
  }

  .buttonContainer {
    width: 216px;
    margin: 20px auto;
    flex-shrink: 0;

    .tab {
      height: 48px;
      display: flex;
      align-items: center;
      margin-bottom: 10px;
      border-radius: 12px;
      padding: 0 16px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
      background: white;
      transition: all 0.3s;
      text-decoration: none;

      .btn-icon {
        color: #8F95B2;
      }

      .text {
        color: #8F95B2;
        font-size: 15px;
        font-weight: bold;
        margin-left: 12px;
      }
    }

    .tab:hover {
      cursor: pointer;
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(108, 93, 211, 0.2);

      .text, .btn-icon {
        color: #6C5DD3;
      }
    }
  }

  .sidebar.is-collapsed {
    width: 0 !important;
    border: none;

    * {
      display: none !important;
    }
  }
}
</style>
