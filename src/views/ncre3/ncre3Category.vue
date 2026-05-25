<template>
  <div class="ncre3-category">
    <div class="page-header">
      <el-button text @click="$router.push('/ncre3')">
        <el-icon><ArrowLeft /></el-icon>
        返回首页
      </el-button>
      <h2 class="category-title">{{ categoryLabel }}</h2>
      <el-tag v-if="subKey" type="info">{{ subKey }}</el-tag>
    </div>

    <div v-if="loading" class="loading-area">
      <el-skeleton :rows="5" animated />
    </div>

    <div v-else-if="category === 'sql'" class="questions-list">
      <sqlAnswerCard v-for="q in questions" :key="q.id" :item="q" />
    </div>

    <div v-else-if="category === 'java_network'" class="questions-list">
      <javaAnswerCard v-for="q in questions" :key="q.id" :item="q" />
    </div>

    <div v-else-if="category === 'java_debug'" class="questions-list">
      <javaAnswerCard v-for="q in questions" :key="q.id" :item="q" />
    </div>

    <div v-else-if="category === 'uml'" class="questions-list">
      <umlViewer v-for="q in questions" :key="q.id" :item="q" />
    </div>

    <div v-else-if="category === 'software_testing'" class="questions-list">
      <testingTable v-for="q in questions" :key="q.id" :item="q" />
    </div>

    <div v-else-if="category === 'theory'" class="questions-list">
      <div class="theory-toolbar">
        <span class="count">共 {{ questions.length }} 题</span>
        <div class="toolbar-actions">
          <el-switch v-model="practiceMode" active-text="练习" inactive-text="" active-color="#6C5DD3" style="margin-right: 8px;" />
          <el-button type="primary" text size="small" @click="downloadTheory">
            <el-icon><Download /></el-icon>
            导出题目
          </el-button>
          <el-switch v-model="showAnswers" active-text="显示答案" inactive-text="隐藏答案" active-color="#6C5DD3" v-if="!practiceMode" />
        </div>
      </div>
      <theoryCard v-for="(q, i) in questions" :key="q.id" :question="q" :index="i" :showAnswer="showAnswers" :practiceMode="practiceMode" />
    </div>

    <div v-else class="empty-area">
      <el-empty description="未知分类" />
    </div>

    <div v-if="!loading && questions.length" class="bottom-hint">--- 已经到底啦 ---</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { loadNcre3Data } from '@/utils/ncre3Loader'
import { useNcre3Store } from '@/stores/ncre3'
import sqlAnswerCard from '@/components/ncre3/sqlAnswerCard.vue'
import javaAnswerCard from '@/components/ncre3/javaAnswerCard.vue'
import umlViewer from '@/components/ncre3/umlViewer.vue'
import testingTable from '@/components/ncre3/testingTable.vue'
import theoryCard from '@/components/ncre3/theoryCard.vue'

const route = useRoute()
const store = useNcre3Store()

const loading = ref(true)
const questions = ref([])
const showAnswers = ref(false)
const practiceMode = ref(false)

// Parse category and optional subKey from route params
// Route pattern: /ncre3/:category or /ncre3/sql_pet_221
const category = computed(() => {
  const param = route.params.category || ''
  if (param.startsWith('sql_')) return 'sql'
  if (param.startsWith('theory')) return 'theory'
  if (param === 'java_network' || param === 'java_debug' || param === 'uml' || param === 'software_testing') return param
  return param
})

const subKey = computed(() => {
  const param = route.params.category || ''
  if (param.startsWith('sql_')) return param.replace('sql_', '')
  if (param.startsWith('theory')) return param.replace('theory', '').replace(/^_/, '') || ''
  return ''
})

const categoryLabel = computed(() => {
  const map = {
    sql: 'SQL 数据库题',
    java_network: 'Java 网络编程',
    java_debug: 'Java 调试题',
    uml: 'UML 设计题',
    software_testing: '软件测试题',
    theory: '理论题库'
  }
  return map[category.value] || category.value
})

// Map route category param to actual JSON file name
const fileNameMap = {
  java_network: 'java_network',
  java_debug: 'java_debug',
  uml: 'uml_design',
  software_testing: 'software_testing'
}

async function loadData() {
  loading.value = true
  try {
    if (category.value === 'theory') {
      if (subKey.value && subKey.value.startsWith('p')) {
        // Load single practice file (100 questions each)
        const data = await loadNcre3Data('ncre3_theory_' + subKey.value)
        questions.value = data
      } else if (subKey.value) {
        // Type-based filtering: load all and filter
        const data = await loadNcre3Data('ncre3_theory_all')
        questions.value = data.filter(q => q.type === subKey.value)
      } else {
        const data = await loadNcre3Data('ncre3_theory_all')
        questions.value = data
      }
    } else if (category.value === 'sql' && subKey.value) {
      const data = await loadNcre3Data(`sql_${subKey.value}`)
      questions.value = data
    } else if (category.value === 'sql' && !subKey.value) {
      const sets = ['sql_pet_221', 'sql_pet_222', 'sql_pet_223', 'sql_student_224', 'sql_student_225']
      const all = []
      for (const s of sets) {
        const data = await loadNcre3Data(s)
        all.push(...data)
      }
      questions.value = all
    } else {
      const fileName = fileNameMap[category.value] || category.value
      const data = await loadNcre3Data(fileName)
      questions.value = data
    }
    store.loadQuestions(questions.value)
    store.currentCategory = category.value
  } catch (e) {
    console.error('Failed to load data:', e)
    questions.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
watch(() => route.params.category, loadData)

function downloadTheory() {
  const labels = ['A', 'B', 'C', 'D', 'E', 'F']
  const typeMap = { trueOrFalse: '判断题', singleChoice: '单选题', multipleChoice: '多选题' }
  const lines = []
  questions.value.forEach((q, i) => {
    lines.push(`${i + 1}. [${typeMap[q.type] || '未知'}] ${q.questionStem}`)
    if (q.option) q.option.forEach((opt, j) => lines.push(`   ${labels[j]}、${opt}`))
    lines.push(`   【答案】${q.answer}`)
    lines.push('')
  })
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ncre3_theory_${subKey.value || 'all'}_${new Date().toISOString().split('T')[0]}.txt`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success(`已导出 ${questions.value.length} 题`)
}
</script>

<style lang="scss" scoped>
.ncre3-category {
  max-width: 900px;
  margin: 0 auto;

  .page-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;

    .category-title {
      font-size: 22px;
      font-weight: bold;
      color: #333;
      margin: 0;
    }
  }

  .loading-area {
    padding: 40px 20px;
  }

  .questions-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .theory-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    padding: 12px 16px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

    .count {
      font-size: 15px;
      color: #666;
      font-weight: 500;
    }

    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }

  .bottom-hint {
    text-align: center;
    color: #bbb;
    padding: 32px 0;
    font-size: 14px;
  }

  .empty-area {
    padding: 60px 0;
  }
}
</style>
