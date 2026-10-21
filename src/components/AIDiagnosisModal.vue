<template>
    <el-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)"
        title="端侧 AI 环境自检（Beta）" width="520px" class="ai-diag-dialog" append-to-body>
        <!-- 状态概览 -->
        <div class="diag-summary">
            <span class="dot" :class="aiStore.dotClass"></span>
            <span>{{ aiStore.statusText }}</span>
            <el-tag size="small" type="info" effect="plain" class="beta-tag">本地运行 · 离线可用</el-tag>
        </div>

        <!-- 检测项列表：未通过标红 -->
        <div class="check-list">
            <div v-for="item in checkItems" :key="item.name" class="check-item" :class="`is-${item.status}`">
                <div class="check-head">
                    <span class="check-name">{{ item.name }}</span>
                    <el-tag size="small" :type="tagType(item.status)">{{ statusLabel(item.status) }}</el-tag>
                </div>
                <div class="check-desc">{{ item.desc }}</div>
                <el-progress v-if="item.progress !== undefined" :percentage="item.progress" :stroke-width="6"
                    :show-text="false" class="check-progress" />
            </div>
        </div>

        <!-- 配置指南：flag 一键复制 -->
        <div class="flag-guide">
            <div class="guide-title">开启指引（Chrome / Edge，128+ 或 Canary）</div>
            <ol class="guide-steps">
                <li>复制下方 flag 链接，<b>粘贴到浏览器地址栏</b>打开并按推荐值设置（chrome:// 链接无法点击跳转）：</li>
                <li v-for="f in flags" :key="f.url" class="flag-row">
                    <div class="flag-line">
                        <code>{{ f.url }}</code>
                        <el-button size="small" text type="primary" @click="copyFlag(f.url)">复制</el-button>
                    </div>
                    <div class="flag-req">推荐值：{{ f.req }}<span v-if="f.optional">（可选）</span> — {{ f.note }}</div>
                </li>
                <li>触发模型下载：打开 <code>chrome://components</code>，找到「Optimization Guide On Device
                    Model」点击「检查更新」；下载进度也可在 <code>chrome://on-device-internals</code> 查看。</li>
                <li>全部开启后重启浏览器，回到本页点「重新检测」。</li>
            </ol>
            <el-alert type="info" :closable="false"
                title="端侧 AI 在本地浏览器运行，题库原有功能不受其影响；不支持时仅 AI 相关入口降级。" />
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

// Chrome flags 开启清单（Gemini Nano / Gemma 4 底座 / MTP 投机解码）
const flags = [
    { url: 'chrome://flags/#prompt-api-for-gemini-nano', req: 'Enabled', note: 'Prompt API 总开关' },
    { url: 'chrome://flags/#optimization-guide-on-device-model', req: 'Enabled BypassPrefRequirement', note: '跳过硬件门槛预检' },
    { url: 'chrome://flags/#gemma4-for-built-in-ai', req: 'Enabled', note: '选用 Gemma 4 底座', optional: true },
    { url: 'chrome://flags/#on-device-model-speculative-decoding', req: 'Enabled', note: 'MTP 投机解码加速（吞吐 +20%~30%）', optional: true },
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

// 检测项：ok 通过 / warn 非阻断（辅助能力）/ fail 未通过（标红）
const checkItems = computed(() => {
    const b = browser.value
    const items = []

    // 1. 浏览器内核与版本
    const verOk = b.isChromium && b.version >= 128
    items.push({
        name: '浏览器内核',
        status: verOk ? 'ok' : 'fail',
        desc: verOk
            ? `Chromium ${b.version}，满足要求`
            : b.isChromium
                ? `Chromium ${b.version} 版本过低，需 128 以上（推荐 Canary 通道）`
                : '未检测到 Chromium 内核，请使用 Chrome / Edge（推荐 Canary 通道）',
    })

    // 2. Prompt API 接口暴露
    items.push({
        name: 'Prompt API（端侧大模型）',
        status: promptExposed.value ? 'ok' : 'fail',
        desc: promptExposed.value
            ? '接口已暴露'
            : '接口未暴露：请按下方指引开启对应 chrome://flags',
    })

    // 3. 模型权重状态（跟随 ai store 状态机）
    const s = aiStore.status
    // <1% 保留一位小数：多 GB 权重下载初期整数恒为 0%，一位小数才能看出进度在动
    const pct = aiStore.downloadProgress * 100
    const pctText = aiStore.downloadProgress > 0 ? (pct < 1 ? ` ${pct.toFixed(1)}%` : ` ${Math.round(pct)}%`) : ''
    const weightMap = {
        available: { status: 'ok', desc: '模型就绪，可立即使用' },
        'after-download': { status: 'warn', desc: '接口就绪，首次使用时将自动下载模型权重' },
        downloading: {
            status: 'warn',
            desc: `模型权重下载中${pctText}…若长时间停在 0%：多为组件下载被网络阻断（需能访问 Google 服务器），请确认代理可用，再打开 chrome://components 找到「Optimization Guide On Device Model」点「检查更新」强制重试`,
            progress: Math.round(pct),
        },
        unsupported: { status: 'fail', desc: '模型不可用：请开启 flags 并在 chrome://components 触发下载' },
        checking: { status: 'ok', desc: '检测中…' },
    }
    items.push({ name: '模型权重', ...(weightMap[s] || weightMap.checking) })

    // 4. WebGPU（辅助：影响推理速度，非必需）
    items.push({
        name: 'WebGPU 硬件加速',
        status: webgpu.value ? 'ok' : 'warn',
        desc: webgpu.value ? '已启用' : '未启用（不阻断功能，推理速度可能较慢）',
    })

    // 5. Summarizer API（辅助能力）
    items.push({
        name: 'Summarizer API',
        status: summarizerExposed.value ? 'ok' : 'warn',
        desc: summarizerExposed.value ? '接口已暴露' : '接口未暴露（不影响题目解析与离线问答）',
    })
    return items
})

function tagType(status) {
    return { ok: 'success', warn: 'warning', fail: 'danger' }[status] || 'info'
}
function statusLabel(status) {
    return { ok: '通过', warn: '提醒', fail: '未通过' }[status] || status
}

async function copyFlag(url) {
    try {
        await navigator.clipboard.writeText(url)
        ElMessage.success('已复制，请粘贴到浏览器地址栏打开')
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
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    padding: 4px 0 12px;

    .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        flex-shrink: 0;

        &.checking { background: #b8bec9; }
        &.ok { background: #0BDE00; }
        &.warn { background: #e8a51e; }
        &.error { background: #FF3B3B; }
    }

    .beta-tag {
        margin-left: auto;
    }
}

.check-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 14px;

    .check-item {
        border: 1px solid #ebeef5;
        border-radius: 8px;
        padding: 8px 12px;

        &.is-fail {
            border-color: #fbc4c4;
            background: #fef0f0;

            .check-name { color: #c45656; }
            .check-desc { color: #c45656; }
        }

        &.is-warn {
            border-color: #f3d19e;
            background: #fdf6ec;
        }

        .check-head {
            display: flex;
            align-items: center;
            justify-content: space-between;

            .check-name {
                font-size: 13px;
                font-weight: 600;
                color: #303133;
            }
        }

        .check-desc {
            font-size: 12px;
            color: #909399;
            margin-top: 4px;
            line-height: 1.5;
        }

        .check-progress {
            margin-top: 6px;
        }
    }
}

.flag-guide {
    .guide-title {
        font-size: 13px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 8px;
    }

    .guide-steps {
        margin: 0 0 12px;
        padding-left: 18px;
        font-size: 12px;
        color: #606266;
        line-height: 1.7;

        code {
            background: #f4f4f5;
            color: #6C5DD3;
            padding: 1px 6px;
            border-radius: 4px;
            font-size: 11px;
            word-break: break-all;
        }

        .flag-row {
            margin: 6px 0;

            .flag-line {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
            }

            .flag-req {
                color: #909399;
                font-size: 11px;
                margin-top: 2px;
            }
        }
    }
}

@media (max-width: 600px) {
    :deep(.el-dialog) {
        width: 92vw !important;
    }
}
</style>
