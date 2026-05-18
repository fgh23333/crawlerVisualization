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

      <div class="filter-actions">
        <el-button v-if="filter !== 'all' && filteredItems.length" type="danger" text @click="clearCurrent">
          清空当前列表
        </el-button>
        <el-button type="primary" text @click="downloadData">
          <el-icon><Download /></el-icon>
          导出题目
        </el-button>
      </div>
    </div>

    <div v-if="filteredItems.length === 0" class="empty-area">
      <el-empty :description="filter === 'all' ? '暂无收藏或复习记录' : filter === 'liked' ? '暂无收藏题目' : '暂无需复习题目'" />
    </div>

    <div v-else class="favorites-list">
      <template v-for="(item, idx) in filteredItems" :key="item.id">
        <sqlAnswerCard v-if="item.category === 'sql'" :item="item" />
        <javaAnswerCard v-else-if="item.category === 'java_network' || item.category === 'java_debug'" :item="item" />
        <umlViewer v-else-if="item.category === 'uml'" :item="item" />
        <testingTable v-else-if="item.category === 'software_testing'" :item="item" />
        <theoryCard v-else :question="item" :index="idx" :showAnswer="true" />
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ArrowLeft, Download } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useNcre3Store } from '@/stores/ncre3'
import sqlAnswerCard from '@/components/ncre3/sqlAnswerCard.vue'
import javaAnswerCard from '@/components/ncre3/javaAnswerCard.vue'
import umlViewer from '@/components/ncre3/umlViewer.vue'
import testingTable from '@/components/ncre3/testingTable.vue'
import theoryCard from '@/components/ncre3/theoryCard.vue'

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

function downloadData() {
  const items = filteredItems.value
  if (!items.length) {
    ElMessage.warning('暂无数据可导出')
    return
  }

  // Build text content
  const lines = []
  items.forEach((item, i) => {
    const isTheory = !item.category
    if (isTheory) {
      const typeMap = { trueOrFalse: '判断题', singleChoice: '单选题', multipleChoice: '多选题' }
      lines.push(`${i + 1}. [${typeMap[item.type] || '未知'}] ${item.questionStem}`)
      const labels = ['A', 'B', 'C', 'D', 'E', 'F']
      if (item.option) {
        item.option.forEach((opt, j) => {
          lines.push(`   ${labels[j]}、${opt}`)
        })
      }
      lines.push(`   【答案】${item.answer}`)
    } else {
      lines.push(`${i + 1}. ${item.questionStem || item.title || item.id}`)
      if (item.answer) lines.push(`   【答案】${item.answer}`)
      if (item.code) lines.push(`   【代码】\n${item.code}`)
      if (item.files) {
        item.files.forEach(f => {
          lines.push(`   【${f.filename}】\n${f.code}`)
        })
      }
      if (item.testCases) {
        lines.push('   【测试用例】')
        item.testCases.forEach(tc => {
          lines.push(`   ${tc.caseId}. 输入: ${tc.input} | 预期: ${tc.expectedResult} | 状态: ${tc.status}`)
        })
      }
    }
    lines.push('')
  })

  const text = lines.join('\n')
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ncre3_${filter.value}_${new Date().toISOString().split('T')[0]}.txt`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success(`已导出 ${items.length} 条记录`)
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

    .filter-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
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
