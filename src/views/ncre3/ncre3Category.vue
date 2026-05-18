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

    <div v-else class="empty-area">
      <el-empty description="未知分类" />
    </div>

    <div v-if="!loading && questions.length" class="bottom-hint">--- 已经到底啦 ---</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { loadNcre3Data } from '@/utils/ncre3Loader'
import { useNcre3Store } from '@/stores/ncre3'
import sqlAnswerCard from '@/components/ncre3/sqlAnswerCard.vue'
import javaAnswerCard from '@/components/ncre3/javaAnswerCard.vue'
import umlViewer from '@/components/ncre3/umlViewer.vue'
import testingTable from '@/components/ncre3/testingTable.vue'

const route = useRoute()
const store = useNcre3Store()

const loading = ref(true)
const questions = ref([])

// Parse category and optional subKey from route params
// Route pattern: /ncre3/:category or /ncre3/sql_pet_221
const category = computed(() => {
  const param = route.params.category || ''
  if (param.startsWith('sql_')) return 'sql'
  if (param === 'java_network' || param === 'java_debug' || param === 'uml' || param === 'software_testing') return param
  return param
})

const subKey = computed(() => {
  const param = route.params.category || ''
  if (param.startsWith('sql_')) return param.replace('sql_', '') // e.g., "pet_221"
  return ''
})

const categoryLabel = computed(() => {
  const map = {
    sql: 'SQL 数据库题',
    java_network: 'Java 网络编程',
    java_debug: 'Java 调试题',
    uml: 'UML 设计题',
    software_testing: '软件测试题'
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
    if (category.value === 'sql' && subKey.value) {
      // Load specific SQL set, e.g. sql_pet_221
      const data = await loadNcre3Data(`sql_${subKey.value}`)
      questions.value = data
    } else if (category.value === 'sql' && !subKey.value) {
      // Load all SQL sets and merge
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
