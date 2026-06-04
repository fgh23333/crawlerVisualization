<template>
  <div class="cq-page">
    <!-- 顶部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button text @click="$router.push('/newHome')" class="back-btn">
          <el-icon><ArrowLeft /></el-icon>
          返回首页
        </el-button>
        <div>
          <h1 class="page-title">计算机组成原理题库</h1>
          <p class="page-desc">单选 · 多选 · 填空，共 {{ questions.length }} 题</p>
        </div>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <el-radio-group v-model="activeType" @change="currentPage = 1">
        <el-radio-button value="all">全部</el-radio-button>
        <el-radio-button value="single">单选题 ({{ typeCount.single }})</el-radio-button>
        <el-radio-button value="multiple">多选题 ({{ typeCount.multiple }})</el-radio-button>
        <el-radio-button value="fill">填空题 ({{ typeCount.fill }})</el-radio-button>
      </el-radio-group>

      <div class="toolbar-right">
        <span class="switch-label">默认显示答案</span>
        <el-switch v-model="showAllAnswers" active-color="#6C5DD3" />
        <el-input
          v-model="searchQuery"
          placeholder="搜索题目..."
          clearable
          style="width: 200px"
          @input="currentPage = 1"
          @clear="currentPage = 1"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
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

    <!-- 结果提示 -->
    <div v-if="searchQuery || activeType !== 'all'" class="result-info">
      找到 <strong>{{ filteredQuestions.length }}</strong> 题
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="loading-area">
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
      <el-empty description="没有找到相关题目" />
    </div>

    <!-- 题目列表 -->
    <div v-else class="questions-list">
      <div
        v-for="q in pagedQuestions"
        :key="q.id"
        class="question-card"
      >
        <div class="q-header">
          <div class="q-meta">
            <span class="q-num">{{ q.id }}</span>
            <el-tag
              size="small"
              :type="typeTagMap[q.type]"
              effect="plain"
              class="q-type-tag"
            >{{ typeLabelMap[q.type] }}</el-tag>
          </div>
          <el-button
            text
            size="small"
            :type="isAnswerVisible(q.id) ? 'success' : 'info'"
            @click="toggleAnswer(q.id)"
          >
            {{ isAnswerVisible(q.id) ? '收起答案' : '显示答案' }}
          </el-button>
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
import { Download, Search, ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const BASE = import.meta.env.DEV
  ? '/cdn-api'
  : 'https://mypan.rayni.xyz'
const CDN_JSON = `${BASE}/raw/computer-question/tiku.json`
const CDN_IMG  = `${BASE}/raw/computer-question/images/`
const PAGE_SIZE = 20

const questions    = ref([])
const loading      = ref(true)
const loadError    = ref(false)
const activeType   = ref('all')
const searchQuery  = ref('')
const showAnswerSet  = ref(new Set())
const showAllAnswers = ref(false)
const exporting      = ref(false)
const currentPage    = ref(1)

const typeLabelMap = { single: '单选', multiple: '多选', fill: '填空' }
const typeTagMap   = { single: 'primary', multiple: 'warning', fill: 'success' }

const typeCount = computed(() => ({
  single:   questions.value.filter(q => q.type === 'single').length,
  multiple: questions.value.filter(q => q.type === 'multiple').length,
  fill:     questions.value.filter(q => q.type === 'fill').length,
}))

const filteredQuestions = computed(() => {
  let list = questions.value
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

watch([activeType, searchQuery], () => { currentPage.value = 1 })

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

// showAnswerSet 存储"单独切换"的 id：
//   全局关闭时，set 中的 id = 单独打开
//   全局开启时，set 中的 id = 单独关闭
function isAnswerVisible(id) {
  return showAllAnswers.value ? !showAnswerSet.value.has(id) : showAnswerSet.value.has(id)
}

function toggleAnswer(id) {
  const s = new Set(showAnswerSet.value)
  s.has(id) ? s.delete(id) : s.add(id)
  showAnswerSet.value = s
}

// 切换全局开关时清空单独覆盖记录
watch(showAllAnswers, () => { showAnswerSet.value = new Set() })

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

  // 预加载所有图片为 base64
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

  const typeLabel = activeType.value !== 'all' ? typeLabelMap[activeType.value] : '全部题型'
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
<div class="meta">${typeLabel}${searchLabel} · 共 ${list.length} 题</div>
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
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 16px;

  .header-left {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .back-btn {
    align-self: flex-start;
    color: #888;
    font-size: 13px;
    padding: 0;
    margin-bottom: 4px;

    &:hover { color: #6C5DD3; }
  }

  .page-title {
    font-size: 28px;
    font-weight: bold;
    color: #333;
    margin-bottom: 4px;
  }

  .page-desc {
    font-size: 15px;
    color: #888;
  }
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;

    .switch-label {
      font-size: 13px;
      color: #666;
      white-space: nowrap;
    }
  }
}

.result-info {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;

  strong { color: #333; }
}

.loading-area {
  padding: 40px 0;
}

.empty-area {
  padding: 60px 0;
}

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

  &:hover {
    box-shadow: 0 4px 20px rgba(108, 93, 211, 0.1);
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

    .q-type-tag {
      font-size: 12px;
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

    .answer-label {
      font-weight: 600;
      color: #065f46;
      margin-right: 4px;
    }

    .answer-text {
      color: #065f46;
      font-weight: 500;
    }
  }
}

.answer-slide-enter-active,
.answer-slide-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.answer-slide-enter-from,
.answer-slide-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
  padding-top: 0;
  padding-bottom: 0;
}
.answer-slide-enter-to,
.answer-slide-leave-from {
  opacity: 1;
  max-height: 150px;
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
