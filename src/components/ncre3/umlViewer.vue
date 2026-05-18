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

    <el-button type="primary" @click="downloadFile" class="download-btn">
      <el-icon><Download /></el-icon>
      下载 .mdj 文件（使用 StarUML 打开）
    </el-button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Star, Flag, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useNcre3Store } from '@/stores/ncre3'

const store = useNcre3Store()
const props = defineProps({ item: { type: Object, required: true } })

const diagramTypeLabel = computed(() => {
  const map = {
    UMLClassDiagram: '类图',
    UMLEntityRelationshipDiagram: 'ER图',
    UMLStateMachineDiagram: '状态机图',
    UMLSequenceDiagram: '时序图',
    UMLUseCaseDiagram: '用例图',
    UMLDiagram: 'UML图'
  }
  return map[props.item.diagramType] || props.item.diagramType
})

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

  .download-btn {
    width: 100%;
    border-radius: 12px;
    height: 44px;
  }
}
</style>
