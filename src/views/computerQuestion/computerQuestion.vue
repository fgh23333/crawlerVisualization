<template>
  <div class="cq-page">
    <!-- 头部 -->
    <div class="page-header">
      <button class="back-btn" @click="$router.push('/newHome')">
        <el-icon><ArrowLeft /></el-icon>
        返回首页
      </button>
      <div class="header-body">
        <div class="header-title-row">
          <h1 class="page-title">计算机组成原理题库</h1>
          <div v-if="!loading" class="stat-chips">
            <span class="stat-chip chip-total">{{ questions.length }} 题</span>
            <span class="stat-chip chip-single">单选 {{ typeCount.single }}</span>
            <span class="stat-chip chip-multiple">多选 {{ typeCount.multiple }}</span>
            <span class="stat-chip chip-fill">填空 {{ typeCount.fill }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 工具栏（单行）-->
    <div class="toolbar-wrap">
      <div class="toolbar-left">
        <div class="view-tabs">
          <button :class="['view-tab', { active: viewMode === 'bank' }]" @click="switchView('bank')">
            <el-icon><List /></el-icon>
            题库
          </button>
          <button :class="['view-tab', { active: viewMode === 'favorites' }]" @click="switchView('favorites')">
            <el-icon><Star /></el-icon>
            收藏夹
            <span v-if="store.favorites.length" class="fav-badge">{{ store.favorites.length }}</span>
          </button>
          <button :class="['view-tab', { active: viewMode === 'graph' }]" @click="switchView('graph')">
            <el-icon><Share /></el-icon>
            知识图谱
          </button>
        </div>
        <div v-if="viewMode !== 'graph'" class="divider-v"></div>
        <div v-if="viewMode !== 'graph'" class="type-tabs">
          <button
            v-for="tab in typeTabs"
            :key="tab.value"
            :class="['type-tab', { active: activeType === tab.value }]"
            @click="activeType = tab.value; currentPage = 1"
          >{{ tab.label }}</button>
        </div>
      </div>

      <div v-if="viewMode === 'graph'" class="toolbar-right">
        <span class="graph-hint">点击节点查看知识点详情 · 滚轮缩放 · 拖拽平移</span>
      </div>
      <div v-else class="toolbar-right">
        <span class="switch-label">显示答案</span>
        <el-switch v-model="showAllAnswers" active-color="#6C5DD3" />
        <el-input
          v-model="searchQuery"
          placeholder="搜索题目..."
          clearable
          style="width: 180px"
          @input="currentPage = 1"
          @clear="currentPage = 1"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-button
          type="primary"
          :loading="exporting"
          :disabled="!filteredQuestions.length"
          @click="exportPDF"
        >
          <el-icon v-if="!exporting"><Download /></el-icon>
          {{ exporting ? '生成中...' : '导出 PDF' }}
        </el-button>
      </div>
    </div>

    <!-- 知识点筛选条 -->
    <div v-if="viewMode !== 'graph' && activeKp" class="kp-filter-bar">
      <el-icon class="kp-filter-icon"><Share /></el-icon>
      <span class="kp-filter-label">知识点</span>
      <span class="kp-filter-name">{{ activeKp.title }}</span>
      <span class="kp-filter-count">{{ filteredQuestions.length }} 题</span>
      <button class="kp-filter-clear" @click="clearKpFilter">
        <el-icon><Close /></el-icon>
      </button>
    </div>

    <!-- 结果提示 -->
    <div v-if="viewMode !== 'graph' && !activeKp && (searchQuery || activeType !== 'all' || viewMode === 'favorites')" class="result-info">
      <template v-if="viewMode === 'favorites' && !store.favorites.length">
        收藏夹为空，点击题目右上角的 ☆ 收藏题目
      </template>
      <template v-else>
        {{ viewMode === 'favorites' ? '收藏夹' : '筛选结果' }}：共 <strong>{{ filteredQuestions.length }}</strong> 题
      </template>
    </div>

    <!-- 知识图谱视图 -->
    <KnowledgeGraph
      v-if="viewMode === 'graph'"
      :knowledge-points="knowledgePoints"
      :relations="relations"
      :loading="kgLoading"
      :load-error="kgError"
      @retry="loadKnowledgeGraph"
      @view-questions="handleViewQuestions"
    />

    <!-- 加载中 -->
    <div v-else-if="loading" class="loading-area">
      <el-skeleton :rows="5" animated />
    </div>

    <!-- 错误 -->
    <div v-else-if="loadError" class="empty-area">
      <el-empty description="题库加载失败">
        <el-button type="primary" @click="loadData">重试</el-button>
      </el-empty>
    </div>

    <!-- 空结果 -->
    <div v-else-if="!filteredQuestions.length" class="empty-area">
      <el-empty :description="viewMode === 'favorites' ? '收藏夹为空' : '没有找到相关题目'" />
    </div>

    <!-- 题目列表 -->
    <div v-else class="questions-list">
      <div
        v-for="q in pagedQuestions"
        :key="q.id"
        class="question-card"
        :class="{ 'is-favorited': store.isFavorite(q.id) }"
      >
        <div class="q-header">
          <div class="q-meta">
            <span class="q-num">{{ q.id }}</span>
            <el-tag size="small" :type="typeTagMap[q.type]" effect="plain">
              {{ typeLabelMap[q.type] }}
            </el-tag>
          </div>
          <div class="q-actions">
            <button
              class="fav-btn"
              :class="{ active: store.isFavorite(q.id) }"
              @click="handleFavorite(q)"
              :title="store.isFavorite(q.id) ? '取消收藏' : '收藏'"
            >
              <el-icon v-if="store.isFavorite(q.id)"><StarFilled /></el-icon>
              <el-icon v-else><Star /></el-icon>
            </button>
            <el-button
              text size="small"
              :type="isAnswerVisible(q.id) ? 'success' : 'info'"
              @click="toggleAnswer(q.id)"
            >
              {{ isAnswerVisible(q.id) ? '收起答案' : '显示答案' }}
            </el-button>
          </div>
        </div>

        <div class="q-content">
          <div class="q-text" v-html="renderText(q.question, q.images)"></div>
          <div v-if="q.options && Object.keys(q.options).length" class="q-options">
            <div v-for="(val, key) in q.options" :key="key" class="option-row">
              <span class="opt-key">{{ key }}</span>
              <span class="opt-val" v-html="renderText(val, q.images)"></span>
            </div>
          </div>
        </div>

        <Transition name="answer-slide">
          <div v-if="isAnswerVisible(q.id)" class="q-answer">
            <span class="answer-label">答案：</span>
            <span class="answer-text">
              {{ Array.isArray(q.answer) ? q.answer.join('；') : q.answer }}
            </span>
          </div>
        </Transition>
      </div>

      <!-- 收藏夹清空按钮 -->
      <div v-if="viewMode === 'favorites' && store.favorites.length" class="fav-clear-row">
        <el-button type="danger" text size="small" @click="clearFavorites">清空收藏夹</el-button>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="PAGE_SIZE"
          :total="filteredQuestions.length"
          layout="prev, pager, next, jumper"
          background
          @change="scrollTop"
        />
      </div>

      <div class="bottom-hint">--- 第 {{ currentPage }}/{{ totalPages }} 页，共 {{ filteredQuestions.length }} 题 ---</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Download, Search, ArrowLeft, Star, StarFilled, List, Share, Close } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useComputerQuestionStore } from '@/stores/computerQuestion'
import KnowledgeGraph from './KnowledgeGraph.vue'

const store = useComputerQuestionStore()

const BASE = import.meta.env.DEV
  ? '/cdn-api'
  : 'https://mypan.rayni.xyz'
const CDN_JSON = `${BASE}/raw/computer-question/tiku.json`
const CDN_KG   = `${BASE}/raw/computer-question/knowledge_graph.json`
const CDN_IMG  = `${BASE}/raw/computer-question/images/`
const PAGE_SIZE = 20

const questions      = ref([])
const loading        = ref(true)
const loadError      = ref(false)
const viewMode       = ref('bank')       // 'bank' | 'favorites'
const activeType     = ref('all')
const searchQuery    = ref('')
const showAnswerSet  = ref(new Set())
const showAllAnswers = ref(false)
const exporting      = ref(false)
const currentPage    = ref(1)

// 知识图谱
const knowledgePoints = ref([])
const relations       = ref([])
const kgLoading       = ref(false)
const kgError         = ref(false)
const kgLoaded        = ref(false)
const activeKp        = ref(null)   // 从图谱跳转过来时按知识点筛选

const typeLabelMap = { single: '单选', multiple: '多选', fill: '填空' }
const typeTagMap   = { single: 'primary', multiple: 'warning', fill: 'success' }
const typeTabs = [
  { value: 'all',      label: '全部' },
  { value: 'single',   label: '单选题' },
  { value: 'multiple', label: '多选题' },
  { value: 'fill',     label: '填空题' },
]

const typeCount = computed(() => {
  const src = viewMode.value === 'favorites' ? store.favorites : questions.value
  return {
    single:   src.filter(q => q.type === 'single').length,
    multiple: src.filter(q => q.type === 'multiple').length,
    fill:     src.filter(q => q.type === 'fill').length,
  }
})

const filteredQuestions = computed(() => {
  let list = viewMode.value === 'favorites' ? store.favorites : questions.value
  if (activeKp.value) {
    const idSet = new Set(activeKp.value.questionIds)
    list = list.filter(q => idSet.has(q.id))
  }
  if (activeType.value !== 'all') {
    list = list.filter(q => q.type === activeType.value)
  }
  const kw = searchQuery.value.trim().toLowerCase()
  if (kw) {
    list = list.filter(q => {
      if (q.question.toLowerCase().includes(kw)) return true
      if (q.options) return Object.values(q.options).some(v => v.toLowerCase().includes(kw))
      return false
    })
  }
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredQuestions.value.length / PAGE_SIZE)))

const pagedQuestions = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredQuestions.value.slice(start, start + PAGE_SIZE)
})

watch([activeType, searchQuery, viewMode], () => { currentPage.value = 1 })

function switchView(mode) {
  viewMode.value = mode
  activeType.value = 'all'
  searchQuery.value = ''
  if (mode !== 'bank') activeKp.value = null
  if (mode === 'graph' && !kgLoaded.value) loadKnowledgeGraph()
}

async function loadKnowledgeGraph() {
  if (kgLoading.value) return
  kgLoading.value = true
  kgError.value = false
  try {
    const res = await fetch(CDN_KG)
    if (!res.ok) throw new Error('fetch failed')
    const kg = await res.json()
    knowledgePoints.value = kg.knowledge_points || []
    relations.value = kg.relations || []
    kgLoaded.value = true
  } catch {
    kgError.value = true
  } finally {
    kgLoading.value = false
  }
}

// 从图谱弹窗「查看习题」跳转到题库并按知识点筛选
function handleViewQuestions({ id, title, questionIds }) {
  activeKp.value = { id, title, questionIds }
  viewMode.value = 'bank'
  activeType.value = 'all'
  searchQuery.value = ''
  currentPage.value = 1
  scrollTop()
}

function clearKpFilter() {
  activeKp.value = null
  currentPage.value = 1
}

function renderText(text, images) {
  if (!text) return ''
  let result = text
  if (images && images.length) {
    images.forEach((img, i) => {
      const url = CDN_IMG + img.filename
      result = result.replace(
        `[图片${i + 1}]`,
        `<img class="inline-img" src="${url}" alt="图片${i+1}" loading="lazy" />`
      )
    })
  }
  return result.replace(/\n/g, '<br />')
}

function isAnswerVisible(id) {
  return showAllAnswers.value ? !showAnswerSet.value.has(id) : showAnswerSet.value.has(id)
}

function toggleAnswer(id) {
  const s = new Set(showAnswerSet.value)
  s.has(id) ? s.delete(id) : s.add(id)
  showAnswerSet.value = s
}

watch(showAllAnswers, () => { showAnswerSet.value = new Set() })

function handleFavorite(q) {
  const added = store.toggleFavorite(q)
  ElMessage({ message: added ? '已收藏' : '已取消收藏', type: added ? 'success' : 'info', duration: 1200 })
}

async function clearFavorites() {
  try {
    await ElMessageBox.confirm('确定清空收藏夹吗？', '提示', {
      confirmButtonText: '清空', cancelButtonText: '取消', type: 'warning'
    })
    store.clearFavorites()
    ElMessage.success('已清空收藏夹')
  } catch {}
}

async function loadData() {
  loading.value = true
  loadError.value = false
  try {
    const res = await fetch(CDN_JSON)
    if (!res.ok) throw new Error('fetch failed')
    questions.value = await res.json()
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

async function getImageDataURL(url) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

async function exportPDF() {
  if (exporting.value) return
  exporting.value = true
  const list = filteredQuestions.value

  const allFilenames = new Set()
  list.forEach(q => q.images?.forEach(img => allFilenames.add(img.filename)))
  const imgMap = {}
  await Promise.all([...allFilenames].map(async fname => {
    const data = await getImageDataURL(CDN_IMG + fname)
    if (data) imgMap[fname] = data
  }))

  const typeColorMap = { single: '#2563eb', multiple: '#7c3aed', fill: '#059669' }

  function buildQuestionHTML(q) {
    let qText = q.question || ''
    q.images?.forEach((img, i) => {
      const src = imgMap[img.filename] || (CDN_IMG + img.filename)
      qText = qText.replace(`[图片${i+1}]`, `<img src="${src}" style="max-width:480px;display:block;margin:8px 0;border-radius:6px;" />`)
    })
    qText = qText.replace(/\n/g, '<br />')

    let optHTML = ''
    if (q.options && Object.keys(q.options).length) {
      optHTML = '<div style="margin-top:10px;">' +
        Object.entries(q.options).map(([k, v]) => {
          let vv = v || ''
          q.images?.forEach((img, i) => {
            const src = imgMap[img.filename] || (CDN_IMG + img.filename)
            vv = vv.replace(`[图片${i+1}]`, `<img src="${src}" style="max-width:300px;vertical-align:middle;border-radius:4px;" />`)
          })
          return `<div style="display:flex;gap:10px;padding:4px 0;"><span style="font-weight:600;min-width:20px;color:#555;">${k}.</span><span>${vv}</span></div>`
        }).join('') + '</div>'
    }

    const ans = Array.isArray(q.answer) ? q.answer.join('；') : (q.answer || '')
    const color = typeColorMap[q.type] || '#6b7280'
    const typeLabel = typeLabelMap[q.type] || q.type

    return `
      <div style="margin-bottom:24px;padding:16px 20px;border:1px solid #e5e7eb;border-radius:10px;page-break-inside:avoid;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
          <span style="font-weight:700;font-size:15px;color:#111;">${q.id}.</span>
          <span style="padding:2px 8px;border-radius:5px;font-size:12px;font-weight:600;color:white;background:${color};">${typeLabel}</span>
        </div>
        <div style="font-size:14px;line-height:1.75;color:#1f2937;">${qText}</div>
        ${optHTML}
        <div style="margin-top:12px;padding:8px 12px;background:#f0fdf4;border-left:3px solid #10b981;border-radius:4px;font-size:13px;">
          <span style="font-weight:600;color:#065f46;">答案：</span><span style="color:#065f46;">${ans}</span>
        </div>
      </div>`
  }

  const viewLabel = viewMode.value === 'favorites' ? '收藏夹' : (activeType.value !== 'all' ? typeLabelMap[activeType.value] : '全部题型')
  const searchLabel = searchQuery.value ? `，搜索"${searchQuery.value}"` : ''

  const html = `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8">
<title>计算机组成原理题库</title>
<style>
* { margin:0;padding:0;box-sizing:border-box; }
body { font-family:'PingFang SC','Microsoft YaHei','Noto Sans SC',sans-serif;background:#fff;padding:40px;color:#1f2937; }
h1 { font-size:24px;font-weight:700;color:#111;margin-bottom:4px; }
.meta { font-size:13px;color:#6b7280;margin-bottom:32px;padding-bottom:16px;border-bottom:2px solid #e5e7eb; }
</style>
</head><body>
<h1>计算机组成原理题库</h1>
<div class="meta">${viewLabel}${searchLabel} · 共 ${list.length} 题</div>
${list.map(q => buildQuestionHTML(q)).join('')}
</body></html>`

  const win = window.open('', '_blank')
  if (!win) {
    ElMessage.error('请允许弹出窗口后重试')
    exporting.value = false
    return
  }
  win.document.write(html)
  win.document.close()
  setTimeout(() => {
    win.print()
    exporting.value = false
  }, 800)
}

function scrollTop() {
  document.documentElement.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(loadData)
</script>

<style lang="scss" scoped>
.cq-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 20px;

  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    border: none;
    background: none;
    color: #94a3b8;
    font-size: 13px;
    cursor: pointer;
    padding: 0;
    margin-bottom: 10px;
    transition: color 0.15s;
    &:hover { color: #6C5DD3; }
  }

  .header-body {
    .header-title-row {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .page-title {
      font-size: 26px;
      font-weight: 700;
      color: #1e293b;
      letter-spacing: -0.3px;
      margin: 0;
    }

    .stat-chips {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;

      .stat-chip {
        padding: 3px 10px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
      }
      .chip-total   { background: #f1f5f9; color: #475569; }
      .chip-single  { background: #eff6ff; color: #2563eb; }
      .chip-multiple{ background: #f5f3ff; color: #7c3aed; }
      .chip-fill    { background: #f0fdf4; color: #16a34a; }
    }
  }
}

.toolbar-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 16px;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  padding: 8px 12px;
  flex-wrap: nowrap;
  overflow-x: auto;

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: nowrap;
    flex-shrink: 0;
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: nowrap;
    flex-shrink: 0;

    .switch-label {
      font-size: 12px;
      color: #64748b;
      white-space: nowrap;
    }

    .graph-hint {
      font-size: 12px;
      color: #94a3b8;
      white-space: nowrap;
    }
  }

  .divider-v {
    width: 1px;
    height: 20px;
    background: #e2e8f0;
    flex-shrink: 0;
  }
}

.view-tabs {
  display: flex;
  background: #fff;
  padding: 3px;
  border-radius: 8px;
  gap: 2px;
  border: 1px solid #e2e8f0;

  .view-tab {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 5px 12px;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    color: #64748b;
    background: transparent;
    cursor: pointer;
    transition: all 0.12s;
    white-space: nowrap;

    &:hover { color: #334155; }

    &.active {
      background: #6C5DD3;
      color: #fff;
      font-weight: 600;
    }

    .fav-badge {
      background: rgba(255,255,255,0.3);
      color: white;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 700;
      padding: 1px 5px;
      line-height: 1.4;
    }

    &:not(.active) .fav-badge {
      background: #6C5DD3;
      color: white;
    }
  }
}

.type-tabs {
  display: flex;
  gap: 2px;

  .type-tab {
    padding: 5px 11px;
    border: none;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    color: #64748b;
    background: transparent;
    cursor: pointer;
    transition: all 0.12s;
    white-space: nowrap;

    &:hover { background: #e2e8f0; color: #334155; }

    &.active {
      background: #fff;
      color: #1e293b;
      font-weight: 600;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
  }
}

.result-info {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
  strong { color: #333; }
}

.kp-filter-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding: 10px 14px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(108, 93, 211, 0.1), rgba(108, 93, 211, 0.04));
  border: 1px solid rgba(108, 93, 211, 0.2);

  .kp-filter-icon {
    color: #6C5DD3;
    font-size: 16px;
  }
  .kp-filter-label {
    font-size: 12px;
    color: #8b80c9;
    font-weight: 600;
  }
  .kp-filter-name {
    font-size: 15px;
    font-weight: 700;
    color: #4c3fb0;
    letter-spacing: -0.2px;
  }
  .kp-filter-count {
    font-size: 12px;
    font-weight: 600;
    color: #fff;
    background: #6C5DD3;
    padding: 2px 10px;
    border-radius: 20px;
  }
  .kp-filter-clear {
    margin-left: auto;
    width: 26px;
    height: 26px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: #8b80c9;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    &:hover { background: rgba(108, 93, 211, 0.15); color: #4c3fb0; }
  }
}

.loading-area { padding: 40px 0; }
.empty-area   { padding: 60px 0; }

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.question-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s;

  &:hover { box-shadow: 0 4px 20px rgba(108, 93, 211, 0.1); }

  &.is-favorited {
    border-left: 3px solid #f59e0b;
  }

  .q-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;

    .q-meta {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .q-num {
      font-size: 13px;
      font-weight: 700;
      color: #aaa;
      min-width: 24px;
    }

    .q-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .fav-btn {
      width: 28px;
      height: 28px;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #cbd5e1;
      font-size: 16px;
      transition: all 0.15s;

      &:hover { background: #fef9ee; color: #f59e0b; }
      &.active { color: #f59e0b; }
    }
  }

  .q-content {
    .q-text {
      font-size: 15px;
      line-height: 1.8;
      color: #222;

      :deep(.inline-img) {
        max-width: 100%;
        max-height: 320px;
        display: block;
        margin: 10px 0;
        border-radius: 8px;
        border: 1px solid #f0f0f0;
      }
    }

    .q-options {
      margin-top: 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;

      .option-row {
        display: flex;
        gap: 10px;
        align-items: flex-start;

        .opt-key {
          flex-shrink: 0;
          width: 26px;
          height: 26px;
          border: 1.5px solid #ddd;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          color: #555;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 1px;
        }

        .opt-val {
          font-size: 14px;
          color: #333;
          line-height: 1.7;
          flex: 1;
          :deep(.inline-img) {
            max-width: 100%;
            max-height: 200px;
            border-radius: 6px;
            display: block;
            margin: 4px 0;
          }
        }
      }
    }
  }

  .q-answer {
    margin-top: 14px;
    padding: 10px 14px;
    background: #f0fdf4;
    border-left: 3px solid #10b981;
    border-radius: 8px;
    font-size: 14px;

    .answer-label { font-weight: 600; color: #065f46; margin-right: 4px; }
    .answer-text  { color: #065f46; font-weight: 500; }
  }
}

.answer-slide-enter-active,
.answer-slide-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.answer-slide-enter-from,
.answer-slide-leave-to {
  opacity: 0; max-height: 0;
  margin-top: 0; padding-top: 0; padding-bottom: 0;
}
.answer-slide-enter-to,
.answer-slide-leave-from {
  opacity: 1; max-height: 150px;
}

.fav-clear-row {
  display: flex;
  justify-content: flex-end;
  padding-top: 4px;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
}

.bottom-hint {
  text-align: center;
  color: #bbb;
  padding: 20px 0;
  font-size: 13px;
}
</style>
