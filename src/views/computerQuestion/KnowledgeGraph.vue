<template>
  <div class="kg-wrap">
    <!-- 加载中 -->
    <div v-if="loading" class="kg-state">
      <div class="kg-spinner"></div>
      <p>正在构建知识星图…</p>
    </div>

    <!-- 错误 -->
    <div v-else-if="loadError" class="kg-state">
      <p class="kg-err">知识图谱加载失败</p>
      <button class="kg-retry" @click="$emit('retry')">重试</button>
    </div>

    <!-- 图谱画布 -->
    <div v-else class="kg-canvas">
      <!-- 图例 -->
      <div class="kg-legend">
        <div class="legend-title">关系类型</div>
        <div v-for="(c, type) in REL_COLORS" :key="type" class="legend-item">
          <span class="legend-line" :style="{ background: c }"></span>
          <span class="legend-text">{{ type }}</span>
        </div>
        <div class="legend-divider"></div>
        <div class="legend-note">节点越大 · 关联题目越多</div>
      </div>

      <RelationGraph
        ref="graphRef"
        :options="graphOptions"
        :on-node-click="onNodeClick"
      >
        <template #node="{ node }">
          <div
            class="kg-node"
            :class="`tier-${node.data.tier}`"
            :style="{ width: node.width + 'px', height: node.height + 'px' }"
          >
            <span class="kg-node-title">{{ node.text }}</span>
            <span class="kg-node-count">{{ node.data.count }}</span>
          </div>
        </template>
      </RelationGraph>
    </div>

    <!-- 知识点详情弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :show-close="false"
      width="560px"
      align-center
      class="kp-dialog"
      append-to-body
    >
      <template #header>
        <div class="kpd-header" v-if="current">
          <div class="kpd-eyebrow">
            <span class="kpd-dot"></span>
            知识点详情
          </div>
          <h2 class="kpd-title">{{ current.title }}</h2>
          <div class="kpd-meta">
            <span class="kpd-badge">{{ current.question_ids.length }} 道关联题目</span>
            <span v-if="current.relCount" class="kpd-badge ghost">{{ current.relCount }} 条关联</span>
          </div>
        </div>
      </template>

      <div v-if="current" class="kpd-body">
        <p class="kpd-detail">{{ current.detail }}</p>

        <div v-if="current.links.length" class="kpd-relations">
          <div class="kpd-section-label">关联知识点</div>
          <div class="kpd-rel-list">
            <button
              v-for="link in current.links"
              :key="link.id + link.type"
              class="kpd-rel-chip"
              :style="{ '--rel-c': REL_COLORS[link.type] || '#8b94c9' }"
              @click="jumpTo(link.id)"
            >
              <span class="kpd-rel-type">{{ link.type }}</span>
              <span class="kpd-rel-name">{{ link.title }}</span>
            </button>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="kpd-footer">
          <button class="kpd-btn ghost" @click="dialogVisible = false">关闭</button>
          <button
            class="kpd-btn primary"
            :disabled="!current || !current.question_ids.length"
            @click="viewQuestions"
          >
            查看习题
            <span v-if="current" class="kpd-btn-num">{{ current.question_ids.length }}</span>
          </button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import RelationGraph from 'relation-graph-vue3'

const props = defineProps({
  knowledgePoints: { type: Array, default: () => [] },
  relations: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  loadError: { type: Boolean, default: false },
})
const emit = defineEmits(['retry', 'view-questions'])

// 关系类型 -> 颜色（浅色系）
const REL_COLORS = {
  包含: '#14b8a6',
  前置: '#f59e0b',
  相关: '#6366f1',
  对比: '#ec4899',
}

const graphRef = ref(null)
const dialogVisible = ref(false)
const current = ref(null)

const kpMap = computed(() => {
  const m = {}
  props.knowledgePoints.forEach(kp => { m[kp.id] = kp })
  return m
})

// relation-graph 配置
const graphOptions = reactive({
  debug: false,
  backgroundColor: 'transparent',
  layout: {
    layoutName: 'force',
    maxLayoutTimes: 300,
    force_node_repulsion: 1.6,
    force_line_elastic: 0.6,
  },
  defaultJunctionPoint: 'border',
  defaultNodeShape: 0,
  defaultLineShape: 1,
  defaultLineColor: 'rgba(148,163,184,0.5)',
  lineUseTextColor: true,
  defaultNodeColor: 'transparent',
  defaultNodeBorderWidth: 0,
  allowShowMiniToolBar: false,
  allowSwitchLineShape: false,
  allowSwitchJunctionPoint: false,
  disableNodeClickEffect: false,
  zoomToFitWhenRefresh: true,
  moveToCenterWhenRefresh: true,
  defaultExpandHolderPosition: 'hide',
  defaultFocusRootNode: false,
})

// 根据关联题量分级：决定节点尺寸与样式 tier
function tierOf(count) {
  if (count >= 18) return 3
  if (count >= 10) return 2
  if (count >= 4) return 1
  return 0
}
const TIER_SIZE = { 0: 64, 1: 80, 2: 100, 3: 124 }

function buildGraphData() {
  const relCountMap = {}
  props.relations.forEach(r => {
    relCountMap[r.source] = (relCountMap[r.source] || 0) + 1
    relCountMap[r.target] = (relCountMap[r.target] || 0) + 1
  })

  const nodes = props.knowledgePoints.map(kp => {
    const count = kp.question_ids?.length || 0
    const tier = tierOf(count)
    const size = TIER_SIZE[tier]
    return {
      id: kp.id,
      text: kp.title,
      width: size,
      height: size,
      data: { count, tier },
    }
  })

  const lines = props.relations.map(r => ({
    from: r.source,
    to: r.target,
    text: r.type,
    color: REL_COLORS[r.type] || 'rgba(148,163,184,0.6)',
    fontColor: REL_COLORS[r.type] || '#94a3b8',
    lineWidth: r.type === '包含' ? 2 : 1.4,
    isHideArrow: r.type === '相关' || r.type === '对比',
  }))

  return { rootId: nodes[0]?.id, nodes, lines }
}

let inited = false
function render() {
  if (!props.knowledgePoints.length || !graphRef.value) return
  const data = buildGraphData()
  graphRef.value.setJsonData(data, () => { inited = true })
}

watch(
  () => [props.loading, props.loadError, props.knowledgePoints.length],
  async () => {
    if (!props.loading && !props.loadError && props.knowledgePoints.length) {
      await nextTick()
      render()
    }
  },
  { immediate: true }
)

function buildCurrent(kp) {
  const links = props.relations
    .filter(r => r.source === kp.id || r.target === kp.id)
    .map(r => {
      const otherId = r.source === kp.id ? r.target : r.source
      const other = kpMap.value[otherId]
      return other ? { id: otherId, title: other.title, type: r.type } : null
    })
    .filter(Boolean)
  return { ...kp, links, relCount: links.length }
}

function onNodeClick(nodeObject) {
  const kp = kpMap.value[nodeObject.id]
  if (!kp) return
  current.value = buildCurrent(kp)
  dialogVisible.value = true
}

function jumpTo(kpId) {
  const kp = kpMap.value[kpId]
  if (!kp) return
  current.value = buildCurrent(kp)
  // 让图谱聚焦到该节点
  const inst = graphRef.value?.getInstance?.()
  if (inst) {
    const node = inst.getNodeById(kpId)
    if (node) inst.focusNodeById?.(kpId)
  }
}

function viewQuestions() {
  if (!current.value) return
  emit('view-questions', {
    id: current.value.id,
    title: current.value.title,
    questionIds: current.value.question_ids,
  })
  dialogVisible.value = false
}
</script>

<style lang="scss" scoped>
.kg-wrap {
  position: relative;
  height: calc(100vh - 240px);
  min-height: 520px;
  border-radius: 20px;
  overflow: hidden;
  background:
    radial-gradient(circle at 22% 18%, rgba(108, 93, 211, 0.10), transparent 42%),
    radial-gradient(circle at 80% 78%, rgba(20, 184, 166, 0.08), transparent 46%),
    radial-gradient(circle at 60% 30%, rgba(236, 72, 153, 0.05), transparent 40%),
    #f7f8fc;
  border: 1px solid #eceefb;
  box-shadow: inset 0 0 80px rgba(108, 93, 211, 0.04), 0 12px 36px rgba(108, 93, 211, 0.08);
}

/* 网格点背景 */
.kg-wrap::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(108, 93, 211, 0.10) 1px, transparent 1px);
  background-size: 26px 26px;
  pointer-events: none;
  opacity: 0.7;
}

.kg-canvas {
  position: absolute;
  inset: 0;
}

/* relation-graph 内部容器透明 */
:deep(.rel-map),
:deep(.relation-graph) {
  background: transparent !important;
}

/* 图例 */
.kg-legend {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 20;
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(14px);
  border: 1px solid #ececf7;
  box-shadow: 0 6px 20px rgba(108, 93, 211, 0.08);
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;

  .legend-title {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.5px;
    color: #8b80c9;
    text-transform: uppercase;
    margin-bottom: 2px;
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .legend-line {
    width: 18px;
    height: 3px;
    border-radius: 2px;
  }
  .legend-text {
    font-size: 12.5px;
    color: #475569;
  }
  .legend-divider {
    height: 1px;
    background: #eef0f8;
    margin: 4px 0;
  }
  .legend-note {
    font-size: 11px;
    color: #94a3b8;
  }
}

/* 节点 */
.kg-node {
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
  padding: 6px;
  box-sizing: border-box;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  border: 1.5px solid;

  .kg-node-title {
    font-size: 12px;
    font-weight: 600;
    line-height: 1.22;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .kg-node-count {
    margin-top: 3px;
    font-size: 11px;
    font-weight: 700;
    opacity: 0.7;
  }

  &:hover {
    transform: scale(1.08);
  }

  /* 分级配色：题量越多颜色越浓 */
  &.tier-0 {
    background: radial-gradient(circle at 35% 28%, #ffffff, #eef0fb);
    border-color: #d9dcf4;
    box-shadow: 0 4px 14px rgba(108, 93, 211, 0.12);
    .kg-node-title { font-size: 11px; color: #4b5274; }
    .kg-node-count { color: #8b90b8; }
  }
  &.tier-1 {
    background: radial-gradient(circle at 35% 28%, #f3f1fe, #e0dbfb);
    border-color: #c4bcf4;
    box-shadow: 0 5px 18px rgba(124, 108, 232, 0.18);
    .kg-node-title { color: #4434a0; }
    .kg-node-count { color: #7a6cc8; }
  }
  &.tier-2 {
    background: radial-gradient(circle at 35% 28%, #c9bdf6, #a78bfa);
    border-color: #b8a4fb;
    box-shadow: 0 7px 22px rgba(124, 108, 232, 0.3);
    .kg-node-title { color: #2e2270; }
    .kg-node-count { color: #4c3fb0; }
  }
  &.tier-3 {
    background: radial-gradient(circle at 35% 28%, #8b7cf0, #6c5dd3);
    border-color: #a394ec;
    box-shadow: 0 10px 30px rgba(108, 93, 211, 0.42), 0 0 0 6px rgba(108, 93, 211, 0.08);
    .kg-node-title { font-size: 13px; color: #ffffff; }
    .kg-node-count { color: rgba(255, 255, 255, 0.8); }
  }
  &:hover.tier-3 { box-shadow: 0 14px 38px rgba(108, 93, 211, 0.55), 0 0 0 7px rgba(108, 93, 211, 0.1); }
}

/* 状态 */
.kg-state {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: #64748b;
  font-size: 14px;

  .kg-err { color: #e26a8d; }
  .kg-retry {
    padding: 8px 22px;
    border-radius: 10px;
    border: 1px solid #c4bcf4;
    background: rgba(108, 93, 211, 0.08);
    color: #5b4fd6;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.15s;
    &:hover { background: rgba(108, 93, 211, 0.16); }
  }
}
.kg-spinner {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 3px solid rgba(108, 93, 211, 0.2);
  border-top-color: #6c5dd3;
  animation: kg-spin 0.8s linear infinite;
}
@keyframes kg-spin { to { transform: rotate(360deg); } }
</style>

<style lang="scss">
/* 弹窗（非 scoped，覆盖 element-plus 暗色样式） */
.kp-dialog {
  border-radius: 22px !important;
  overflow: hidden;
  border: 1px solid #ececf7;
  background:
    radial-gradient(circle at 12% 0%, rgba(108, 93, 211, 0.10), transparent 48%),
    radial-gradient(circle at 100% 100%, rgba(20, 184, 166, 0.06), transparent 45%),
    #ffffff !important;
  box-shadow: 0 30px 80px rgba(108, 93, 211, 0.2) !important;

  .el-dialog__header { padding: 24px 28px 0; margin: 0; }
  .el-dialog__body { padding: 16px 28px 8px; }
  .el-dialog__footer { padding: 12px 28px 24px; }

  .kpd-header {
    .kpd-eyebrow {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #8b80c9;
    }
    .kpd-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: #6c5dd3;
      box-shadow: 0 0 8px rgba(108, 93, 211, 0.6);
    }
    .kpd-title {
      margin: 10px 0 12px;
      font-size: 24px;
      font-weight: 700;
      line-height: 1.25;
      color: #1e293b;
      letter-spacing: -0.3px;
    }
    .kpd-meta { display: flex; gap: 8px; flex-wrap: wrap; }
    .kpd-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      color: #5b4fd6;
      background: rgba(108, 93, 211, 0.1);
      border: 1px solid rgba(108, 93, 211, 0.2);
      &.ghost {
        background: transparent;
        color: #94a3b8;
        border-color: #e2e8f0;
      }
    }
  }

  .kpd-body {
    .kpd-detail {
      font-size: 14.5px;
      line-height: 1.85;
      color: #475569;
      margin: 6px 0 4px;
    }
    .kpd-section-label {
      margin: 18px 0 10px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #94a3b8;
    }
    .kpd-rel-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .kpd-rel-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px 6px 8px;
      border-radius: 10px;
      border: 1px solid #ececf7;
      background: #f8f9fd;
      cursor: pointer;
      transition: all 0.15s;
      &:hover {
        border-color: var(--rel-c);
        background: #fff;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(108, 93, 211, 0.1);
      }
      .kpd-rel-type {
        font-size: 11px;
        font-weight: 700;
        color: #fff;
        background: var(--rel-c);
        padding: 2px 7px;
        border-radius: 6px;
      }
      .kpd-rel-name {
        font-size: 13px;
        color: #334155;
      }
    }
  }

  .kpd-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
  .kpd-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 9px 20px;
    border-radius: 11px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.15s;

    &.ghost {
      background: transparent;
      border-color: #e2e8f0;
      color: #64748b;
      &:hover { background: #f1f5f9; color: #334155; }
    }
    &.primary {
      background: linear-gradient(135deg, #7c6ce8, #5b4fd6);
      color: #fff;
      box-shadow: 0 8px 24px rgba(108, 93, 211, 0.35);
      &:hover { transform: translateY(-1px); box-shadow: 0 12px 30px rgba(108, 93, 211, 0.5); }
      &:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; }
    }
    .kpd-btn-num {
      font-size: 12px;
      font-weight: 700;
      padding: 1px 7px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.25);
    }
  }
}
.kp-dialog .el-dialog__headerbtn { display: none; }
</style>
