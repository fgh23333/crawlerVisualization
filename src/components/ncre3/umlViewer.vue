<template>
  <div class="uml-viewer">
    <div class="card-header">
      <div class="title-section">
        <h3 class="card-title">{{ item.title }}</h3>
        <el-tag size="small" type="info">{{ diagramTypeLabel }}</el-tag>
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

    <div v-if="item.classes && item.classes.length" class="class-list">
      <span class="label">涉及的类/接口：</span>
      <el-tag v-for="cls in item.classes" :key="cls" size="small" class="class-tag">{{ cls }}</el-tag>
    </div>

    <!-- Mermaid 图表渲染区域 -->
    <div ref="mermaidContainer" class="mermaid-container">
      <el-skeleton v-if="rendering" :rows="4" animated />
      <div v-else-if="renderError" class="render-fallback">
        <p>图表预览不可用，请下载 .mdj 文件使用 StarUML 查看</p>
      </div>
    </div>

    <el-button type="primary" @click="downloadFile" class="download-btn">
      <el-icon><Download /></el-icon>
      下载 .mdj 文件（使用 StarUML 打开）
    </el-button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Star, Flag, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useNcre3Store } from '@/stores/ncre3'
import { mdjToMermaid, renderMermaid } from '@/utils/mdjRenderer'

const store = useNcre3Store()
const props = defineProps({ item: { type: Object, required: true } })

const mermaidContainer = ref(null)
const rendering = ref(true)
const renderError = ref(false)

const diagramTypeLabel = computed(() => {
  const map = {
    UMLClassDiagram: '类图',
    UMLEntityRelationshipDiagram: 'ER图',
    UMLStateMachineDiagram: '状态机图',
    UMLSequenceDiagram: '时序图',
    UMLUseCaseDiagram: '用例图',
    UMLComponentDiagram: '组件图',
    ERDDiagram: 'ER图',
    UMLStatechartDiagram: '状态机图',
    FCFlowchartDiagram: '流程图',
    UMLDiagram: 'UML图'
  }
  return map[props.item.diagramType] || props.item.diagramType
})

async function loadAndRender() {
  rendering.value = true
  renderError.value = false
  try {
    // Dynamically import the .mdj file (it's JSON, Vite can handle with ?url or raw import)
    const mdjModules = import.meta.glob('/src/assets/ncre3/uml/*.mdj', { query: '?raw', import: 'default', eager: true })
    const key = `/src/assets/ncre3/uml/${props.item.downloadFile}`
    const rawText = mdjModules[key]

    if (!rawText || !mermaidContainer.value) {
      renderError.value = true
      rendering.value = false
      return
    }

    const mdjData = JSON.parse(rawText)
    const mermaidDef = mdjToMermaid(mdjData)
    if (!mermaidDef) {
      renderError.value = true
      rendering.value = false
      return
    }

    rendering.value = false
    await new Promise(r => setTimeout(r, 50))
    await renderMermaid(mermaidDef, mermaidContainer.value)
  } catch (e) {
    console.warn('UML render error:', e)
    renderError.value = true
    rendering.value = false
  }
}

async function downloadFile() {
  try {
    const modules = import.meta.glob('/src/assets/ncre3/uml/*.mdj', { as: 'url' })
    const key = `/src/assets/ncre3/uml/${props.item.downloadFile}`
    const url = await modules[key]()
    const a = document.createElement('a')
    a.href = url
    a.download = props.item.downloadFile
    a.click()
    ElMessage.success('下载成功')
  } catch {
    ElMessage.error('下载失败')
  }
}

function toggleLike() {
  if (store.isLiked(props.item.id)) store.removeLike(props.item.id)
  else store.addLike(props.item)
}

function toggleWrong() {
  if (store.isWrong(props.item.id)) store.removeWrong(props.item.id)
  else store.addWrong(props.item)
}

onMounted(loadAndRender)
</script>

<style lang="scss" scoped>
.uml-viewer {
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
      margin: 0 0 8px 0;
    }
  }

  .class-list {
    margin-bottom: 16px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;

    .label {
      font-size: 13px;
      color: #888;
    }

    .class-tag {
      border-radius: 6px;
    }
  }

  .mermaid-container {
    background: #fafafa;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 16px;
    min-height: 80px;
    overflow-x: auto;
    text-align: center;

    :deep(svg) {
      max-width: 100%;
      height: auto;
    }
  }

  .render-fallback {
    padding: 20px;
    text-align: center;
    color: #999;
    font-size: 14px;
  }

  .download-btn {
    width: 100%;
    border-radius: 12px;
    height: 44px;
  }
}
</style>
