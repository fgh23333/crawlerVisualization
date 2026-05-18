<template>
  <div class="testing-table">
    <div class="card-header">
      <div class="title-section">
        <h3 class="card-title">{{ item.title }}</h3>
        <p class="validation-rule">{{ item.validationRule }}</p>
      </div>
      <div class="actions">
        <el-button :type="store.isLiked(item.id) ? 'warning' : 'default'" circle size="small" @click="toggleLike">
          <el-icon><Star /></el-icon>
        </el-button>
        <el-button :type="store.isWrong(item.id) ? 'danger' : 'default'" circle size="small" @click="toggleWrong">
          <el-icon><Flag /></el-icon>
        </el-button>
      </div>
    </div>

    <el-table :data="item.testCases" stripe border style="width: 100%" :header-cell-style="{ background: '#f5f5fa', color: '#333' }">
      <el-table-column prop="caseId" label="编号" width="60" align="center" />
      <el-table-column prop="description" label="测试描述" min-width="180" />
      <el-table-column prop="input" label="输入" min-width="120">
        <template #default="{ row }">
          <code class="input-code">{{ row.input || '(空)' }}</code>
        </template>
      </el-table-column>
      <el-table-column prop="expectedResult" label="预期结果" min-width="160" />
      <el-table-column prop="status" label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === '通过' ? 'success' : 'danger'" size="small" round>
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { Star, Flag } from '@element-plus/icons-vue'
import { useNcre3Store } from '@/stores/ncre3'

const store = useNcre3Store()
const props = defineProps({ item: { type: Object, required: true } })

function toggleLike() {
  if (store.isLiked(props.item.id)) store.removeLike(props.item.id)
  else store.addLike(props.item)
}

function toggleWrong() {
  if (store.isWrong(props.item.id)) store.removeWrong(props.item.id)
  else store.addWrong(props.item)
}
</script>

<style lang="scss" scoped>
.testing-table {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;

    .card-title {
      font-size: 16px;
      font-weight: bold;
      color: #333;
      margin: 0 0 4px 0;
    }

    .validation-rule {
      font-size: 13px;
      color: #888;
      margin: 0;
    }
  }

  .input-code {
    background: #f5f5fa;
    padding: 2px 8px;
    border-radius: 4px;
    font-family: Consolas, Monaco, monospace;
    font-size: 13px;
    color: #6C5DD3;
  }
}
</style>
