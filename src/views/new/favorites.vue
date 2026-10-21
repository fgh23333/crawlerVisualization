<template>
    <div id="favorites">
        <div class="titleCover">
            <span class="title">收藏夹</span>
            <div class="controls">
                <el-select v-model="value" placeholder="全部题目" size="small" class="type-select">
                    <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value">
                    </el-option>
                </el-select>
                <el-checkbox-group v-model="selectedTypes" size="small" class="typeSelector">
                    <el-checkbox-button v-for="item in questionType" :key="item.value" :label="item.label">{{ item.value
                        }}</el-checkbox-button>
                </el-checkbox-group>
                <el-button type="danger" size="small" class="clearBtn" @click="clearList">清空当前列表</el-button>
                <el-button type="primary" size="small" @click="showExportDialog">导出收藏</el-button>
                <el-button type="success" size="small" @click="showImportDialog">导入收藏</el-button>
                <el-button size="small" class="ai-summary-btn" @click="showAiDialog">AI 归纳</el-button>
            </div>
        </div>
        <questionCard :subjectOptions="value" :favList="list" :selectedTypes="selectedTypes"></questionCard>

        <!-- 导出对话框 -->
        <el-dialog v-model="exportDialogVisible" title="导出收藏" width="500px">
            <p>共 {{ exportCount }} 道题目</p>
            <el-divider />
            <div class="sync-section">
                <h4>方式一：复制文本代码</h4>
                <el-input type="textarea" v-model="exportCode" :rows="3" readonly />
                <el-button type="primary" size="small" @click="copyCode" style="margin-top:8px">
                    复制到剪贴板
                </el-button>
            </div>
            <el-divider />
            <div class="sync-section">
                <h4>方式二：下载JSON文件</h4>
                <el-button type="primary" size="small" @click="downloadJson">
                    下载文件
                </el-button>
            </div>
        </el-dialog>

        <!-- 导入对话框 -->
        <el-dialog v-model="importDialogVisible" title="导入收藏" width="500px">
            <el-radio-group v-model="importMode" style="margin-bottom:16px">
                <el-radio-button value="code">粘贴文本代码</el-radio-button>
                <el-radio-button value="file">上传JSON文件</el-radio-button>
            </el-radio-group>

            <div v-if="importMode === 'code'">
                <el-input type="textarea" v-model="importCode" :rows="4" placeholder="粘贴导出时复制的文本代码" />
            </div>

            <div v-if="importMode === 'file'">
                <el-upload ref="uploadRef" :auto-upload="false" :limit="1" accept=".json"
                    :on-change="handleFileChange" :on-remove="clearImportFile">
                    <template #trigger>
                        <el-button type="primary" size="small">选择JSON文件</el-button>
                    </template>
                </el-upload>
            </div>

            <div v-if="importPreview" style="margin-top:16px">
                <el-alert type="info" :closable="false" :title="`即将导入 ${importPreview.count} 道题目`" />
            </div>

            <template #footer>
                <el-button @click="importDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="parseImport" :disabled="!canParse">
                    解析数据
                </el-button>
                <el-button type="success" @click="confirmImport" :disabled="!importPreview">
                    确认导入
                </el-button>
            </template>
        </el-dialog>

        <!-- 端侧 AI 归纳对话框（Beta，本地生成） -->
        <el-dialog v-model="aiDialogVisible" title="AI 归纳总结（Beta · 本地端侧生成）" width="620px"
            @close="onAiDialogClose">
            <div class="ai-summary-desc">
                将按科目对当前列表（共 {{ list.length }} 题）分组归纳，梳理高频考点与易错方向。全程本地生成，数据不出浏览器。
            </div>
            <div class="ai-summary-body">
                <el-skeleton v-if="aiSummarizing && !aiSummaryText" :rows="6" animated />
                <template v-else-if="aiSummaryText">
                    <div v-html="aiSummaryHtml"></div>
                    <span v-if="aiSummarizing" class="typing-cursor">▍</span>
                </template>
                <el-empty v-else description="点击下方按钮开始归纳" :image-size="80" />
            </div>
            <template #footer>
                <el-button v-if="aiSummarizing" type="warning" plain @click="aiStore.abortTask()">停止</el-button>
                <el-button v-else type="primary" @click="runAiSummary">{{ aiSummarized ? '重新归纳' : '开始归纳' }}</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script>
import questionCard from '@/components/questionCard.vue';
import { makePdf } from "@/utils/makePdf";
import { useQuestionStore } from '@/stores/question';
import { useAiStore } from '@/stores/ai';
import { ElMessageBox, ElMessage } from 'element-plus';
import { decodeFavorites, parseFavoritesFile } from '@/utils/favoritesSync';
import { marked } from 'marked';
import { buildFavoritesSummaryPrompt } from '@/utils/builtinAI';

export default {
    setup() { return { store: useQuestionStore(), aiStore: useAiStore() } },
    data() {
        return {
            questionType: [
                {
                    value: '判断',
                    label: 'rightWrong'
                },
                {
                    value: '单选',
                    label: 'singleChoice'
                },
                {
                    value: '多选',
                    label: 'multipleChoice'
                },
                {
                    value: '填空',
                    label: 'fillingBlank'
                }
            ],
            selectedTypes: ['rightWrong', 'singleChoice', 'multipleChoice', 'fillingBlank'],
            options: [
                {
                    value: 'all',
                    label: '全部'
                },
                {
                    value: 'wrong',
                    label: '错题'
                },
                {
                    value: 'favorites',
                    label: '我的收藏'
                }
            ],
            subjects: [
                {
                    value: '',
                    label: '全部题目'
                },
                {
                    value: 'Marx',
                    label: '马原'
                },
                {
                    value: 'CMH',
                    label: '近代史'
                },
                {
                    value: 'Political',
                    label: '思政'
                },
                {
                    value: 'MaoIntro',
                    label: '毛概'
                },
                {
                    value: 'XiIntro',
                    label: '习概'
                },
                {
                    value: 'ORH',
                    label: '改开史'
                },
                {
                    value: 'NCH',
                    label: '新中国史'
                },
                {
                    value: '社主史',
                    label: 'SDH',
                },
                {
                    value: '党史',
                    label: 'CCPH',
                }
            ],
            value: 'all',
            // 导出
            exportDialogVisible: false,
            exportCode: '',
            exportCount: 0,
            exportBlob: null,
            exportFilename: '',
            // 导入
            importDialogVisible: false,
            importMode: 'code',
            importCode: '',
            importFile: null,
            importPreview: null,
            // 端侧 AI 归纳（会话级，不持久化）
            aiDialogVisible: false,
            aiSummaryText: '',
            aiSummaryHtml: '',
            aiSummarizing: false,
            aiSummarized: false,
        }
    },
    computed: {
        list() {
            switch (this.value) {
                case 'all':
                    const combined = [...this.store.likeList, ...this.store.wrongQuestions];
                    const unique = new Map();
                    combined.forEach(item => unique.set(item.id, item));
                    return Array.from(unique.values());
                case 'favorites':
                    return this.store.likeList;
                case 'wrong':
                    return this.store.wrongQuestions;
                default:
                    return [];
            }
        },
        canParse() {
            if (this.importMode === 'code') {
                return this.importCode.trim().length > 0;
            }
            return this.importFile !== null;
        }
    },
    beforeUnmount() {
        // 离开收藏页：中断进行中的归纳任务并清理节流定时器
        this.aiStore.abortTask();
        if (this._summaryTimer) clearTimeout(this._summaryTimer);
    },
    methods: {
        handleCommand(e) {
            if (e === "savePDF") {
                makePdf("save", this.list, "收藏夹", null, ElMessage);
            }
            if (e === "savePDFNoAnswer") {
                makePdf("save", this.list, "收藏夹", null, ElMessage, true);
            }
            if (e === "printPDF") {
                makePdf("print", this.list, "收藏夹", null, ElMessage);
            }
        },
        clearList() {
            ElMessageBox.confirm('此操作将清空当前列表, 是否继续?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                if (this.value === 'favorites') {
                    this.store.clearLikeList();
                    ElMessage({ type: 'success', message: '收藏夹已清空!' });
                } else if (this.value === 'wrong') {
                    this.store.clearWrongQuestions();
                    ElMessage({ type: 'success', message: '错题本已清空!' });
                } else if (this.value === 'all') {
                    this.store.clearLikeList();
                    this.store.clearWrongQuestions();
                    ElMessage({ type: 'success', message: '所有列表已清空!' });
                }
            }).catch(() => {
                ElMessage({ type: 'info', message: '已取消删除' });
            });
        },

        // ── 导出 ──────────────────────────────────
        showExportDialog() {
            if (!this.store.likeList.length) {
                ElMessage.warning('收藏夹为空，无法导出');
                return;
            }
            const result = this.store.exportFavoritesData();
            this.exportCode = result.code;
            this.exportCount = result.likeList.length;
            this.exportBlob = result.blob;
            this.exportFilename = result.filename;
            this.exportDialogVisible = true;
        },
        copyCode() {
            navigator.clipboard.writeText(this.exportCode).then(() => {
                ElMessage.success('已复制到剪贴板');
            }).catch(() => {
                // fallback
                const textarea = document.createElement('textarea');
                textarea.value = this.exportCode;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                ElMessage.success('已复制到剪贴板');
            });
        },
        downloadJson() {
            const url = URL.createObjectURL(this.exportBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = this.exportFilename;
            a.click();
            URL.revokeObjectURL(url);
            ElMessage.success('文件下载已开始');
        },

        // ── 导入 ──────────────────────────────────
        showImportDialog() {
            this.importMode = 'code';
            this.importCode = '';
            this.importFile = null;
            this.importPreview = null;
            this.importDialogVisible = true;
        },
        handleFileChange(file) {
            this.importFile = file.raw;
        },
        clearImportFile() {
            this.importFile = null;
        },
        async parseImport() {
            try {
                if (this.importMode === 'code') {
                    this.importPreview = decodeFavorites(this.importCode.trim());
                } else {
                    this.importPreview = await parseFavoritesFile(this.importFile);
                }
            } catch (e) {
                ElMessage.error('数据解析失败：' + e.message);
            }
        },
        confirmImport() {
            if (!this.importPreview) return;
            const { added, duplicates } = this.store.importFavoritesData(this.importPreview.data);
            ElMessage.success(`导入完成：新增 ${added} 道${duplicates ? '，' + duplicates + ' 道已存在跳过' : ''}`);
            this.importDialogVisible = false;
            this.importPreview = null;
        },

        // ── 端侧 AI 归纳（Beta，完全依赖本地模型）──────────────────
        showAiDialog() {
            if (!this.list.length) {
                ElMessage.warning('当前列表为空，暂无可归纳的题目');
                return;
            }
            if (!this.aiStore.isReady) {
                this.aiStore.openDiagnosis();
                return;
            }
            this.aiDialogVisible = true;
        },
        onAiDialogClose() {
            // 关闭弹窗即停止生成
            this.aiStore.abortTask();
        },
        // 按科目分组：数量 / 高频题数 / 累计错误次数 / 题干样例（前 5 条）
        buildSummaryGroups() {
            const groups = new Map();
            this.list.forEach(q => {
                const key = q.abbreviationSubject || '未知';
                if (!groups.has(key)) {
                    groups.set(key, { subject: key, total: 0, highFreq: 0, errorTotal: 0, sampleStems: [] });
                }
                const g = groups.get(key);
                g.total += 1;
                if (q.isHighFreq) g.highFreq += 1;
                g.errorTotal += this.store.userRecords?.[q.id]?.errorCount || 0;
                if (g.sampleStems.length < 5) g.sampleStems.push(q.questionStem);
            });
            return Array.from(groups.values());
        },
        // 流式渲染节流：照 gemma.vue scheduleParse 思路
        scheduleSummaryParse() {
            if (this._summaryTimer) return;
            this._summaryTimer = setTimeout(() => {
                this._summaryTimer = null;
                this.aiSummaryHtml = marked.parse(this.aiSummaryText || '');
            }, 100);
        },
        async runAiSummary() {
            const groups = this.buildSummaryGroups();
            if (!groups.length) return;
            const prompt = buildFavoritesSummaryPrompt(groups);
            this.aiSummaryText = '';
            this.aiSummaryHtml = '';
            this.aiSummarizing = true;
            this.aiSummarized = false;
            try {
                const { text, aborted } = await this.aiStore.runTask(prompt, {
                    onDelta: (_chunk, full) => {
                        this.aiSummaryText = full;
                        this.scheduleSummaryParse();
                    }
                });
                if (aborted) {
                    // 中止：保留已生成的半截内容（一字未出则给提示文案）
                    this.aiSummaryText = this.aiSummaryText || '*（已停止生成）*';
                } else {
                    this.aiSummaryText = text;
                    groups.forEach(g => this.aiStore.recordSubjectFocus(g.subject));  // 更新个性化画像
                }
                this.aiSummaryHtml = marked.parse(this.aiSummaryText);
                this.aiSummarized = true;
            } catch (e) {
                ElMessage.error(e?.message || '端侧 AI 归纳失败');
            } finally {
                this.aiSummarizing = false;
            }
        }
    },
    components: {
        questionCard
    }
}
</script>

<style lang="scss" scoped>
.el-selector {
    top: -8px;
}

#favorites {
    .titleCover {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 34px;
        height: 80px;

        .title {
            font-weight: bold;
            font-size: 30px;
            color: #6C5DD3;
            letter-spacing: 2px;
            flex-shrink: 0;
        }

        .controls {
            display: flex;
            align-items: center;
            gap: 15px;
            flex-wrap: wrap;
            justify-content: flex-end;

            .ai-summary-btn {
                background: linear-gradient(135deg, #8b7cf0, #6c5dd3);
                border-color: #6c5dd3;
                color: #fff;

                &:hover,
                &:focus {
                    background: linear-gradient(135deg, #7c6ce8, #5b4fd6);
                    border-color: #5b4fd6;
                    color: #fff;
                }
            }
        }

        .type-select {
            width: 150px;
        }

        .selector {
            .select {
                color: #5A5E70;
                font-size: 24px;
                line-height: 50px;
            }

            .select :deep(.el-input__inner) {
                border: 3px solid #6C5DD3 !important;
                border-radius: 10px !important;
                color: #5A5E70;
                font-size: 24px;
                line-height: 50px;
                font-family: '思源黑体';
                height: 40px;
                font-weight: 500;
            }

            .select :deep(.el-input__inner::placeholder) {
                color: #5A5E70;
                font-family: '思源黑体';
                font-weight: 500;
            }

            .select :deep(.el-input__icon) {
                height: auto;
            }
        }
    }

    .sync-section {
        h4 {
            margin: 8px 0;
            color: #333;
            font-size: 15px;
        }
    }

    // 端侧 AI 归纳弹窗内容区（流式 markdown）
    .ai-summary-desc {
        font-size: 13px;
        color: #909399;
        line-height: 1.6;
        margin-bottom: 12px;
    }

    .ai-summary-body {
        min-height: 200px;
        max-height: 55vh;
        overflow-y: auto;
        border: 1px solid #ebeef5;
        border-radius: 8px;
        padding: 14px 16px;
        font-size: 13.5px;
        line-height: 1.8;
        color: #333;

        :deep(p) { margin: 0 0 8px; }

        :deep(h1),
        :deep(h2),
        :deep(h3),
        :deep(h4) {
            font-size: 15px;
            color: #5b4fd6;
            margin: 10px 0 6px;
        }

        :deep(table) {
            border-collapse: collapse;
            margin: 8px 0;
        }

        :deep(th),
        :deep(td) {
            border: 1px solid #ddd6f8;
            padding: 4px 10px;
            font-size: 12.5px;
        }

        :deep(th) { background: #efecfb; }

        :deep(code) {
            background: #eee9fc;
            color: #5b4fd6;
            padding: 1px 5px;
            border-radius: 4px;
            font-size: 12px;
        }

        :deep(ul),
        :deep(ol) {
            padding-left: 20px;
            margin: 6px 0;
        }

        .typing-cursor {
            display: inline-block;
            color: #6C5DD3;
            animation: ai-typing-blink 0.8s infinite;
        }
    }

    @keyframes ai-typing-blink {

        0%,
        100% {
            opacity: 1;
        }

        50% {
            opacity: 0;
        }
    }

    // 窄屏弹窗自适应
    @media (max-width: 600px) {
        :deep(.el-dialog) {
            width: 92vw !important;
        }
    }
}
</style>
