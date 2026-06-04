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
    </div>
</template>

<script>
import questionCard from '@/components/questionCard.vue';
import { makePdf } from "@/utils/makePdf";
import { useQuestionStore } from '@/stores/question';
import { ElMessageBox, ElMessage } from 'element-plus';
import { decodeFavorites, parseFavoritesFile } from '@/utils/favoritesSync';

export default {
    setup() { return { store: useQuestionStore() } },
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
}
</style>
