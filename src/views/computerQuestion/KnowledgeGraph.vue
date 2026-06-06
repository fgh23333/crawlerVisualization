<template>
  <div class="kg-wrap">
    <!-- 加载中 -->
    <div v-if="loading" class="kg-state">
      <div class="kg-spinner"></div>
      <p>正在构建知识图谱…</p>
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
        <div class="legend-title">节点类型</div>
        <div class="legend-item">
          <span class="legend-dot dot-root"></span>
          <span class="legend-text">课程根节点</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot dot-chapter"></span>
          <span class="legend-text">章节</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot dot-kp"></span>
          <span class="legend-text">知识点</span>
        </div>
        <div class="legend-divider"></div>
        <div class="legend-note">知识点越深 · 关联题目越多</div>
      </div>

      <!-- AI 说明 -->
      <div class="kg-ai-note">
        <el-icon><MagicStick /></el-icon>
        知识图谱与题目归类由 AI 生成，仅供参考
      </div>

      <RelationGraph
        ref="graphRef"
        :options="graphOptions"
        :on-node-click="onNodeClick"
      >
        <template #node="{ node }">
          <!-- 根节点 -->
          <div v-if="node.data.type === 'root'" class="kg-node node-root">
            <span class="kg-node-title">{{ node.text }}</span>
          </div>
          <!-- 章节节点 -->
          <div v-else-if="node.data.type === 'chapter'" class="kg-node node-chapter">
            <span class="kg-node-order">{{ node.data.order }}</span>
            <span class="kg-node-title">{{ node.text }}</span>
          </div>
          <!-- 知识点节点 -->
          <div
            v-else
            class="kg-node node-kp"
            :class="`tier-${node.data.tier}`"
            :style="{ width: node.width + 'px', height: node.height + 'px' }"
          >
            <span class="kg-node-title">{{ node.text }}</span>
            <span v-if="node.data.count" class="kg-node-count">{{ node.data.count }} 题</span>
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
            {{ current.nodeType === 'chapter' ? '章节详情' : '知识点详情' }}
          </div>
          <h2 class="kpd-title">{{ current.title }}</h2>
          <div class="kpd-meta">
            <span v-if="current.chapterTitle" class="kpd-badge ghost">{{ current.chapterTitle }}</span>
            <span v-if="current.nodeType === 'kp'" class="kpd-badge">
              {{ current.question_ids?.length || 0 }} 道关联题目
            </span>
            <span v-if="current.nodeType === 'chapter'" class="kpd-badge">
              {{ current.kpCount }} 个知识点
            </span>
          </div>
        </div>
      </template>

      <div v-if="current" class="kpd-body">
        <p class="kpd-detail">{{ current.detail }}</p>

        <!-- 章节：展示下属知识点列表 -->
        <template v-if="current.nodeType === 'chapter' && current.childKps.length">
          <div class="kpd-section-label">所含知识点</div>
          <div class="kpd-kp-list">
            <button
              v-for="kp in current.childKps"
              :key="kp.id"
              class="kpd-kp-chip"
              @click="openKp(kp.id)"
            >
              <span class="kpd-kp-order">{{ kp.order }}</span>
              <span class="kpd-kp-name">{{ kp.title }}</span>
              <span class="kpd-kp-count">{{ kp.question_ids?.length || 0 }}</span>
            </button>
          </div>
        </template>
      </div>

      <template #footer>
        <div class="kpd-footer">
          <button class="kpd-btn ghost" @click="dialogVisible = false">关闭</button>
          <button
            v-if="current?.nodeType === 'kp'"
            class="kpd-btn primary"
            :disabled="!current.question_ids?.length"
            @click="viewQuestions"
          >
            查看习题
            <span class="kpd-btn-num">{{ current.question_ids?.length || 0 }}</span>
          </button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import RelationGraph from 'relation-graph-vue3'
import { MagicStick } from '@element-plus/icons-vue'

const props = defineProps({
  nodes:     { type: Array,   default: () => [] },
  relations: { type: Array,   default: () => [] },
  loading:   { type: Boolean, default: false },
  loadError: { type: Boolean, default: false },
})
const emit = defineEmits(['retry', 'view-questions'])

const graphRef      = ref(null)
const dialogVisible = ref(false)
const current       = ref(null)

// 节点索引
const nodeMap = computed(() => {
  const m = {}
  props.nodes.forEach(n => { m[n.id] = n })
  return m
})

// 知识点按题量分级
function tierOf(count) {
  if (count >= 18) return 3
  if (count >= 10) return 2
  if (count >= 4)  return 1
  return 0
}
const KP_TIER_SIZE    = { 0: 60, 1: 76, 2: 94, 3: 114 }
const CHAPTER_SIZE_W  = 110
const CHAPTER_SIZE_H  = 48
const ROOT_SIZE_W     = 140
const ROOT_SIZE_H     = 56

// relation-graph 配置
const graphOptions = reactive({
  debug: false,
  backgroundColor: 'transparent',
  layout: {
    layoutName: 'force',
    maxLayoutTimes: 400,
    force_node_repulsion: 2.2,
    force_line_elastic: 0.5,
    force_node_attraction: 0.8,
  },
  defaultJunctionPoint: 'border',
  defaultNodeShape: 0,
  defaultLineShape: 1,
  defaultLineColor: 'rgba(148,163,184,0.45)',
  lineUseTextColor: false,
  defaultNodeColor: 'transparent',
  defaultNodeBorderWidth: 0,
  allowShowMiniToolBar: false,
  allowSwitchLineShape: false,
  allowSwitchJunctionPoint: false,
  zoomToFitWhenRefresh: true,
  moveToCenterWhenRefresh: true,
  defaultExpandHolderPosition: 'hide',
  defaultFocusRootNode: false,
})

function buildGraphData() {
  const rgNodes = props.nodes.map(n => {
    if (n.type === 'root') {
      return { id: n.id, text: n.title, width: ROOT_SIZE_W, height: ROOT_SIZE_H,
               data: { type: 'root' } }
    }
    if (n.type === 'chapter') {
      return { id: n.id, text: n.title, width: CHAPTER_SIZE_W, height: CHAPTER_SIZE_H,
               data: { type: 'chapter', order: n.order } }
    }
    // kp
    const count = n.question_ids?.length || 0
    const tier  = tierOf(count)
    const size  = KP_TIER_SIZE[tier]
    return { id: n.id, text: n.title, width: size, height: size,
             data: { type: 'kp', count, tier } }
  })

  const rgLines = props.relations.map(r => ({
    from: r.source,
    to:   r.target,
    // 根→章节线深一点，章节→知识点线淡一点
    color:     r.source === 'root' ? 'rgba(108,93,211,0.5)' : 'rgba(148,163,184,0.4)',
    lineWidth: r.source === 'root' ? 2 : 1.2,
    isHideArrow: false,
    isHideText: true,
  }))

  return { rootId: 'root', nodes: rgNodes, lines: rgLines }
}

function render() {
  if (!props.nodes.length || !graphRef.value) return
  graphRef.value.setJsonData(buildGraphData())
}

watch(
  () => [props.loading, props.loadError, props.nodes.length],
  async ([loading, err, len]) => {
    if (!loading && !err && len) {
      await nextTick()
      render()
    }
  },
  { immediate: true }
)

// 构建弹窗数据
function buildCurrentNode(nodeId) {
  const n = nodeMap.value[nodeId]
  if (!n) return null

  if (n.type === 'chapter') {
    const childKps = props.nodes
      .filter(x => x.type === 'kp' && x.parent === nodeId)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
    return { ...n, nodeType: 'chapter', childKps, kpCount: childKps.length }
  }

  if (n.type === 'kp') {
    const chapter = nodeMap.value[n.parent]
    return { ...n, nodeType: 'kp', chapterTitle: chapter?.title || '' }
  }

  return null
}

function onNodeClick(nodeObject) {
  const built = buildCurrentNode(nodeObject.id)
  if (!built) return
  current.value = built
  dialogVisible.value = true
}

// 从章节详情点击知识点跳转
function openKp(kpId) {
  const built = buildCurrentNode(kpId)
  if (!built) return
  current.value = built
  // 聚焦节点
  const inst = graphRef.value?.getInstance?.()
  if (inst) inst.focusNodeById?.(kpId)
}

function viewQuestions() {
  if (!current.value) return
  emit('view-questions', {
    id:          current.value.id,
    title:       current.value.title,
    questionIds: current.value.question_ids || [],
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
  background: rgba(255, 255, 255, 0.88);
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
  .legend-dot {
    width: 12px;
    height: 12px;
    border-radius: 3px;
    flex-shrink: 0;
    &.dot-root    { background: linear-gradient(135deg, #7c6ce8, #5b4fd6); border-radius: 8px; }
    &.dot-chapter { background: linear-gradient(135deg, #e0dbfb, #c4bcf4); border-radius: 4px; }
    &.dot-kp      { background: radial-gradient(circle, #f3f1fe, #a78bfa); border-radius: 50%; }
  }
  .legend-text {
    font-size: 12.5px;
    color: #475569;
  }
  .legend-divider {
    height: 1px;
    background: #eef0f8;
    margin: 2px 0;
  }
  .legend-note {
    font-size: 11px;
    color: #94a3b8;
  }
}

/* AI 说明 */
.kg-ai-note {
  position: absolute;
  right: 16px;
  bottom: 14px;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid #ececf7;
  font-size: 11.5px;
  color: #8b80c9;
  pointer-events: none;
  .el-icon { font-size: 13px; }
}

/* 节点基础 */
.kg-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
  box-sizing: border-box;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  &:hover { transform: scale(1.07); }

  .kg-node-title {
    font-weight: 600;
    line-height: 1.25;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .kg-node-count {
    margin-top: 3px;
    font-size: 10px;
    font-weight: 700;
    opacity: 0.7;
  }
}

/* 根节点 */
.node-root {
  width: 140px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, #7c6ce8, #5b4fd6);
  border: 2px solid rgba(255,255,255,0.3);
  box-shadow: 0 8px 28px rgba(108, 93, 211, 0.45), 0 0 0 6px rgba(108, 93, 211, 0.1);
  padding: 0 14px;
  .kg-node-title { font-size: 14px; color: #fff; -webkit-line-clamp: 1; }
  &:hover { box-shadow: 0 12px 36px rgba(108, 93, 211, 0.6), 0 0 0 7px rgba(108, 93, 211, 0.14); }
}

/* 章节节点 */
.node-chapter {
  width: 110px;
  height: 48px;
  border-radius: 10px;
  background: linear-gradient(135deg, #f3f1fe, #e0dbfb);
  border: 1.5px solid #c4bcf4;
  box-shadow: 0 4px 14px rgba(108, 93, 211, 0.15);
  padding: 0 10px;
  gap: 4px;
  flex-direction: row;

  .kg-node-order {
    font-size: 11px;
    font-weight: 800;
    color: #6c5dd3;
    background: rgba(108, 93, 211, 0.12);
    border-radius: 4px;
    padding: 1px 5px;
    flex-shrink: 0;
  }
  .kg-node-title { font-size: 12px; color: #3d2fa0; -webkit-line-clamp: 2; }
  &:hover { box-shadow: 0 6px 20px rgba(108, 93, 211, 0.25); }
}

/* 知识点节点（圆形，四级深浅） */
.node-kp {
  border-radius: 50%;
  border: 1.5px solid;
  padding: 6px;

  .kg-node-title { font-size: 11px; }

  &.tier-0 {
    background: radial-gradient(circle at 35% 28%, #ffffff, #eef0fb);
    border-color: #d9dcf4;
    box-shadow: 0 3px 12px rgba(108, 93, 211, 0.10);
    .kg-node-title { color: #4b5274; }
    .kg-node-count { color: #8b90b8; }
  }
  &.tier-1 {
    background: radial-gradient(circle at 35% 28%, #f3f1fe, #e0dbfb);
    border-color: #c4bcf4;
    box-shadow: 0 4px 16px rgba(124, 108, 232, 0.18);
    .kg-node-title { color: #4434a0; }
    .kg-node-count { color: #7a6cc8; }
  }
  &.tier-2 {
    background: radial-gradient(circle at 35% 28%, #c9bdf6, #a78bfa);
    border-color: #b8a4fb;
    box-shadow: 0 6px 20px rgba(124, 108, 232, 0.30);
    .kg-node-title { color: #2e2270; }
    .kg-node-count { color: #4c3fb0; }
  }
  &.tier-3 {
    background: radial-gradient(circle at 35% 28%, #8b7cf0, #6c5dd3);
    border-color: #a394ec;
    box-shadow: 0 8px 28px rgba(108, 93, 211, 0.42), 0 0 0 5px rgba(108, 93, 211, 0.08);
    .kg-node-title { font-size: 12px; color: #fff; }
    .kg-node-count { color: rgba(255,255,255,0.8); }
    &:hover { box-shadow: 0 12px 36px rgba(108, 93, 211, 0.55), 0 0 0 7px rgba(108, 93, 211, 0.12); }
  }
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

  .kg-err   { color: #e26a8d; }
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
  .el-dialog__body   { padding: 16px 28px 8px; }
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
      font-size: 22px;
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
      &.ghost { background: transparent; color: #94a3b8; border-color: #e2e8f0; }
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
    /* 章节下属知识点列表 */
    .kpd-kp-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .kpd-kp-chip {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 14px;
      border-radius: 10px;
      border: 1px solid #ececf7;
      background: #f8f9fd;
      cursor: pointer;
      text-align: left;
      transition: all 0.15s;
      &:hover {
        border-color: #c4bcf4;
        background: #fff;
        transform: translateX(3px);
        box-shadow: 0 3px 12px rgba(108, 93, 211, 0.1);
      }
      .kpd-kp-order {
        font-size: 11px;
        font-weight: 800;
        color: #6c5dd3;
        background: rgba(108, 93, 211, 0.1);
        border-radius: 4px;
        padding: 1px 6px;
        flex-shrink: 0;
      }
      .kpd-kp-name {
        flex: 1;
        font-size: 13.5px;
        font-weight: 600;
        color: #334155;
      }
      .kpd-kp-count {
        font-size: 12px;
        font-weight: 700;
        color: #8b80c9;
        background: rgba(108, 93, 211, 0.08);
        border-radius: 10px;
        padding: 1px 8px;
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
