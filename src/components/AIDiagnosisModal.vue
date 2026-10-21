<template>
    <el-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)"
        title="端侧 AI 自检" width="520px" class="ai-diag-dialog" append-to-body>
        <!-- 状态概览：单行 -->
        <div class="diag-summary">
            <span class="dot" :class="aiStore.dotClass"></span>
            <span>{{ aiStore.statusText }}</span>
            <el-tag size="small" type="info" effect="plain" class="beta-tag">Beta · 本地运行 · 离线可用</el-tag>
        </div>

        <!-- 检测项：双列网格压缩高度，通过项单格带过，异常项跨双列展开说明 -->
        <div class="check-list">
            <div v-for="item in checkItems" :key="item.name" class="check-item"
                :class="[`is-${item.status}`, { wide: item.status !== 'ok' }]">
                <component :is="iconOf(item.status)" class="check-icon" />
                <span class="check-name">{{ item.name }}</span>
                <span v-if="item.status !== 'ok'" class="check-state">{{ statusLabel(item.status) }}</span>
                <span class="check-val">{{ item.desc }}</span>
                <el-progress v-if="item.progress !== undefined" :percentage="item.progress" :stroke-width="4"
                    :show-text="false" class="check-progress" />
            </div>
        </div>

        <!-- 配置指南：flags 双列 + 一键复制，说明压成两行提示 -->
        <div class="flag-guide">
            <div class="guide-title">开启指引（Chrome / Edge 128+）</div>
            <div class="flag-grid">
                <div class="flag-cell" v-for="f in flags" :key="f.url">
                    <span class="flag-name">
                        {{ f.name }}<code>{{ f.req }}</code><em v-if="f.optional">可选</em>
                    </span>
                    <el-button size="small" text type="primary" class="flag-copy" @click="copyFlag(f.url)">复制</el-button>
                </div>
            </div>
            <div class="guide-hint">
                flags 逐条复制后<b>粘贴到地址栏</b>开启；再到 <code>chrome://components</code> 点「检查更新」，或打开
                <code>chrome://on-device-internals</code> 触发模型下载；<b>重启浏览器</b>后重新检测。
            </div>
        </div>

        <template #footer>
            <el-button @click="close">关闭</el-button>
            <el-button type="primary" :loading="checking" @click="runDiagnostics">重新检测</el-button>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useAiStore } from '@/stores/ai'
import { getBrowserInfo, hasWebGPU, getPromptAPI, getSummarizerAPI } from '@/utils/builtinAI'

// 全站唯一的自检弹窗：由 newHome 挂载，openDiagnosis() 打开（打开时自动重新检测）
const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue'])

const aiStore = useAiStore()

const checking = ref(false)
const browser = ref({ isChromium: false, version: 0 })
const webgpu = ref(false)
const promptExposed = ref(false)
const summarizerExposed = ref(false)

// Chrome flags 开启清单（短名展示，完整 URL 走复制；Gemma 4 底座 / MTP 投机解码为可选加速）
const flags = [
    { name: 'Prompt API', url: 'chrome://flags/#prompt-api-for-gemini-nano', req: 'Enabled' },
    { name: 'On Device Model', url: 'chrome://flags/#optimization-guide-on-device-model', req: 'BypassPrefRequirement' },
    { name: 'Gemma 4 底座', url: 'chrome://flags/#gemma4-for-built-in-ai', req: 'Enabled', optional: true },
    { name: 'MTP 投机解码', url: 'chrome://flags/#on-device-model-speculative-decoding', req: 'Enabled', optional: true },
]

function close() {
    emit('update:modelValue', false)
}

async function runDiagnostics() {
    checking.value = true
    try {
        browser.value = getBrowserInfo()
        webgpu.value = hasWebGPU()
        promptExposed.value = !!getPromptAPI()
        summarizerExposed.value = !!getSummarizerAPI()
        await aiStore.checkEnvironment()
    } finally {
        checking.value = false
    }
}

// 打开弹窗时自动刷新一次检测结果；immediate 兜底：路由切换导致弹窗重建
// 且 modelValue 已为 true 时（如诊断开着时导航），同样立即执行检测而非渲染空初值
watch(() => props.modelValue, (v) => { if (v) runDiagnostics() }, { immediate: true })

// ok 通过（单行带过）/ warn 非阻断（辅助能力）/ fail 未通过（展开说明）
const checkItems = computed(() => {
    const b = browser.value
    const items = []

    // 1. 浏览器内核与版本
    const verOk = b.isChromium && b.version >= 128
    items.push({
        name: '浏览器内核',
        status: verOk ? 'ok' : 'fail',
        desc: verOk
            ? `Chromium ${b.version}`
            : b.isChromium
                ? `Chromium ${b.version} 版本过低，需 128 以上`
                : '未检测到 Chromium 内核，请用 Chrome / Edge',
    })

    // 2. Prompt API 接口暴露
    items.push({
        name: 'Prompt API',
        status: promptExposed.value ? 'ok' : 'fail',
        desc: promptExposed.value ? '已暴露' : '未暴露，请开启下方 flags',
    })

    // 3. 模型权重状态（跟随 ai store 状态机）
    const s = aiStore.status
    // <1% 保留一位小数：多 GB 权重下载初期整数恒为 0%，一位小数才能看出进度在动
    const pct = aiStore.downloadProgress * 100
    const pctText = aiStore.downloadProgress > 0 ? (pct < 1 ? `${pct.toFixed(1)}%` : `${Math.round(pct)}%`) : '0%'
    const weightMap = {
        available: { status: 'ok', desc: '就绪' },
        'after-download': { status: 'warn', desc: '接口就绪，首次使用时将自动下载权重' },
        downloading: {
            status: 'warn',
            desc: `下载中 ${pctText}…长时间停 0% 多为网络阻断（需能访问 Google），到 chrome://components 点「检查更新」或开 chrome://on-device-internals 触发`,
            progress: Math.round(pct),
        },
        unsupported: { status: 'fail', desc: '模型不可用，请开启 flags 并触发下载' },
        checking: { status: 'ok', desc: '检测中' },
    }
    items.push({ name: '模型权重', ...(weightMap[s] || weightMap.checking) })

    // 4. WebGPU（辅助：影响推理速度，非必需）
    items.push({
        name: 'WebGPU',
        status: webgpu.value ? 'ok' : 'warn',
        desc: webgpu.value ? '已启用' : '未启用，推理较慢（不阻断）',
    })

    // 5. Summarizer API（辅助能力）
    items.push({
        name: 'Summarizer',
        status: summarizerExposed.value ? 'ok' : 'warn',
        desc: summarizerExposed.value ? '已暴露' : '未暴露，不影响剖析与问答',
    })
    return items
})

function iconOf(status) {
    return { ok: 'CircleCheckFilled', warn: 'WarningFilled', fail: 'CircleCloseFilled' }[status] || 'CircleCheckFilled'
}
function statusLabel(status) {
    return { warn: '提醒', fail: '未通过' }[status] || status
}

async function copyFlag(url) {
    try {
        await navigator.clipboard.writeText(url)
        ElMessage.success('已复制，请粘贴到地址栏打开')
    } catch {
        ElMessage.warning('复制失败，请手动复制链接')
    }
}
</script>

<style lang="scss" scoped>
.diag-summary {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    color: #303133;
    padding-bottom: 10px;

    .dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        flex-shrink: 0;

        &.checking { background: #b8bec9; }
        &.ok { background: #0BDE00; }
        &.warn { background: #e8a51e; }
        &.error { background: #FF3B3B; }
    }

    .beta-tag {
        margin-left: auto;
        font-weight: 400;
    }
}

.check-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px 12px;
    margin-bottom: 10px;

    .check-item {
        display: flex;
        align-items: center;
        gap: 5px;
        min-width: 0;
        min-height: 22px;

        // 异常项跨双列展开说明（文本可换行，进度条独占一行）
        &.wide {
            grid-column: 1 / -1;
            flex-wrap: wrap;
        }

        .check-icon {
            // 裸渲染的 EP 图标无尺寸 CSS（font-size 不生效），必须显式宽高防 viewBox 撑满格子
            width: 12px;
            height: 12px;
            flex-shrink: 0;
        }

        &.is-ok .check-icon { color: #0BDE00; }
        &.is-warn .check-icon { color: #e8a51e; }
        &.is-fail .check-icon { color: #FF3B3B; }

        .check-name {
            font-size: 12.5px;
            color: #303133;
            flex-shrink: 0;
        }

        .check-state {
            font-size: 11px;
            flex-shrink: 0;
        }

        &.is-warn .check-state { color: #e8a51e; }
        &.is-fail .check-state { color: #FF3B3B; }

        .check-val {
            font-size: 11px;
            color: #909399;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        &.is-fail .check-val { color: #c45656; }

        &.wide .check-val {
            white-space: normal;
            overflow: visible;
            line-height: 1.5;
        }

        .check-progress {
            flex-basis: 100%;
            margin-top: 2px;
        }
    }
}

.flag-guide {
    border-top: 1px dashed #ebeef5;
    padding-top: 8px;

    .guide-title {
        font-size: 12.5px;
        font-weight: 600;
        color: #6C5DD3;
        margin-bottom: 4px;
    }

    .flag-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2px 12px;

        .flag-cell {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 6px;
            min-width: 0;

            .flag-name {
                font-size: 12px;
                color: #303133;
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: 3px;
                min-width: 0;

                code {
                    background: #f4f4f5;
                    color: #6C5DD3;
                    padding: 0 4px;
                    border-radius: 3px;
                    font-size: 10.5px;
                }

                em {
                    font-style: normal;
                    font-size: 10.5px;
                    color: #b8bec9;
                }
            }

            .flag-copy {
                padding: 2px 6px;
                font-size: 11.5px;
                flex-shrink: 0;
            }
        }
    }

    .guide-hint {
        font-size: 11px;
        color: #606266;
        line-height: 1.6;
        margin-top: 6px;

        code {
            background: #f4f4f5;
            color: #6C5DD3;
            padding: 0 4px;
            border-radius: 3px;
            font-size: 10.5px;
        }
    }
}

@media (max-width: 600px) {
    :deep(.el-dialog) {
        width: 92vw !important;
    }
}
</style>
