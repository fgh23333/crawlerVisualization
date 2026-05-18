<template>
  <div class="ncre3-favorites">
    <div class="page-header">
      <el-button text @click="$router.push('/ncre3')">
        <el-icon><ArrowLeft /></el-icon>
        返回首页
      </el-button>
      <h2 class="page-title">收藏夹</h2>
    </div>

    <div class="filter-bar">
      <el-radio-group v-model="filter" size="default">
        <el-radio-button value="all">全部</el-radio-button>
        <el-radio-button value="liked">我的收藏</el-radio-button>
        <el-radio-button value="wrong">需复习</el-radio-button>
      </el-radio-group>

      <el-button v-if="filter !== 'all' && filteredItems.length" type="danger" text @click="clearCurrent">
        清空当前列表
      </el-button>
    </div>

    <div v-if="filteredItems.length === 0" class="empty-area">
      <el-empty :description="filter === 'all' ? '暂无收藏或复习记录' : filter === 'liked' ? '暂无收藏题目' : '暂无需复习题目'" />
    </div>

    <div v-else class="favorites-list">
      <template v-for="item in filteredItems" :key="item.id">
        <sqlAnswerCard v-if="item.category === 'sql'" :item="item" />
        <javaAnswerCard v-else-if="item.category === 'java_network' || item.category === 'java_debug'" :item="item" />
        <umlViewer v-else-if="item.category === 'uml'" :item="item" />
        <testingTable v-else-if="item.category === 'software_testing'" :item="item" />
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useNcre3Store } from '@/stores/ncre3'
import sqlAnswerCard from '@/components/ncre3/sqlAnswerCard.vue'
import javaAnswerCard from '@/components/ncre3/javaAnswerCard.vue'
import umlViewer from '@/components/ncre3/umlViewer.vue'
import testingTable from '@/components/ncre3/testingTable.vue'

const store = useNcre3Store()
const filter = ref('all')

const filteredItems = computed(() => {
  if (filter.value === 'liked') return store.likeList
  if (filter.value === 'wrong') return store.wrongList
  return store.allFavorites
})

async function clearCurrent() {
  try {
    await ElMessageBox.confirm('确定清空当前列表？', '提示', { type: 'warning' })
    if (filter.value === 'liked') store.clearLikeList()
    else if (filter.value === 'wrong') store.clearWrongList()
    ElMessage.success('已清空')
  } catch { /* cancelled */ }
}
</script>

<style lang="scss" scoped>
.ncre3-favorites {
  max-width: 900px;
  margin: 0 auto;

  .page-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;

    .page-title {
      font-size: 22px;
      font-weight: bold;
      color: #333;
      margin: 0;
    }
  }

  .filter-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .empty-area {
    padding: 60px 0;
  }

  .favorites-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
}
</style>
