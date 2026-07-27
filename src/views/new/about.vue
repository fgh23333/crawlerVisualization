<template>
    <div id="aboutUs">
        <div class="info-card">
            <div class="logo-section">
                <img src="@/assets/logo.png" alt="Logo" class="app-logo">
                <h1 class="app-name">思政题库</h1>
                <p class="app-desc">高效复习 · 轻松备考</p>
            </div>

            <div class="content-section">
                <div class="info-item">
                    <div class="label">显示设置</div>
                    <div class="text">调节全局字体大小，刷新后生效。</div>
                    <div class="font-size-control">
                        <span class="font-label">小</span>
                        <el-slider v-model="fontSize" :min="12" :max="20" :step="1" show-stops style="flex:1;margin:0 12px;"></el-slider>
                        <span class="font-label">大</span>
                        <span class="font-value">{{ fontSize }}px</span>
                    </div>
                    <el-button type="primary" size="small" @click="applyFontSize">应用字体大小</el-button>
                </div>

                <div class="info-item">
                    <div class="label">数据同步</div>
                    <div class="text">跨设备同步收藏夹、错题本、标记和学习记录。</div>
                    <div class="sync-actions">
                        <el-button type="primary" size="small" @click="showExportDialog">生成同步码</el-button>
                        <el-button type="success" size="small" @click="showImportDialog">导入同步码</el-button>
                    </div>
                </div>

                <div class="info-item">
                    <div class="label">关于项目</div>
                    <div class="text">本项目致力于为广大学生提供一个便捷、高效的思政课刷题平台，涵盖马原、毛概、思修等多个科目。</div>
                </div>

                <div class="info-item">
                    <div class="label">联系我们</div>
                    <div class="text contact-email">
                        <i class="el-icon-message"></i> info@635262140.xyz
                    </div>
                </div>
            </div>

            <div class="footer">
                &copy; 2026 Political Exam System
            </div>
        </div>

        <!-- 导出同步码对话框 -->
        <el-dialog v-model="exportDialogVisible" title="生成同步码" width="500px">
            <p>将生成包含收藏夹、错题本、标记、学习记录和答案查看状态的同步码。</p>
            <el-divider />
            <div v-if="exportCode">
                <el-input type="textarea" v-model="exportCode" :rows="4" readonly />
                <el-button type="primary" size="small" @click="copyCode" style="margin-top:8px">
                    复制到剪贴板
                </el-button>
            </div>
            <div v-else>
                <el-button type="primary" @click="generateExportCode">生成同步码</el-button>
            </div>
        </el-dialog>

        <!-- 导入同步码对话框 -->
        <el-dialog v-model="importDialogVisible" title="导入同步码" width="500px">
            <el-input type="textarea" v-model="importCode" :rows="4" placeholder="粘贴同步码" />
            <div v-if="importPreview" style="margin-top:16px">
                <el-alert type="info" :closable="false">
                    <div>收藏夹: +{{ importPreview.summary.likeAdded }} 道</div>
                    <div>错题本: +{{ importPreview.summary.wrongAdded }} 道</div>
                    <div>标记: +{{ importPreview.summary.markAdded }} 道</div>
                    <div>学习记录: {{ importPreview.summary.recordsMerged }} 条</div>
                </el-alert>
            </div>
            <template #footer>
                <el-button @click="importDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="parseImportCode" :disabled="!importCode.trim()">
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
import { useQuestionStore } from '@/stores/question';
import { ElMessage } from 'element-plus';
import { encodeAllData, decodeAllData, collectViewedStates, mergeAllData, restoreViewedStates } from '@/utils/favoritesSync';

export default {
    setup() { return { store: useQuestionStore() } },
    data() {
        return {
            fontSize: 16,
            exportDialogVisible: false,
            exportCode: '',
            importDialogVisible: false,
            importCode: '',
            importPreview: null,
        }
    },
    mounted() {
        const saved = localStorage.getItem('global_font_size');
        if (saved) this.fontSize = parseInt(saved, 10) || 16;
    },
    methods: {
        applyFontSize() {
            document.documentElement.style.fontSize = this.fontSize + 'px';
            localStorage.setItem('global_font_size', this.fontSize);
            ElMessage.success('字体大小已应用，刷新页面后全局生效');
        },
        showExportDialog() {
            this.exportCode = '';
            this.exportDialogVisible = true;
        },
        generateExportCode() {
            const payload = {
                wrongQuestions: this.store.wrongQuestions,
                likeList: this.store.likeList,
                markList: this.store.markList,
                userRecords: this.store.userRecords,
                viewedStates: collectViewedStates()
            };
            this.exportCode = encodeAllData(payload);
        },
        copyCode() {
            navigator.clipboard.writeText(this.exportCode).then(() => {
                ElMessage.success('已复制到剪贴板');
            }).catch(() => {
                const textarea = document.createElement('textarea');
                textarea.value = this.exportCode;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                ElMessage.success('已复制到剪贴板');
            });
        },
        showImportDialog() {
            this.importCode = '';
            this.importPreview = null;
            this.importDialogVisible = true;
        },
        parseImportCode() {
            try {
                const decoded = decodeAllData(this.importCode.trim());
                const existing = {
                    wrongQuestions: this.store.wrongQuestions,
                    likeList: this.store.likeList,
                    markList: this.store.markList,
                    userRecords: this.store.userRecords,
                    viewedStates: collectViewedStates()
                };
                const { merged, summary } = mergeAllData(existing, decoded.data);
                this.importPreview = { merged, summary };
            } catch (e) {
                ElMessage.error('解析失败：' + e.message);
            }
        },
        confirmImport() {
            if (!this.importPreview) return;
            const { merged } = this.importPreview;
            this.store.wrongQuestions = merged.wrongQuestions;
            this.store.likeList = merged.likeList;
            this.store.markList = merged.markList;
            this.store.userRecords = merged.userRecords;
            restoreViewedStates(merged.viewedStates);
            ElMessage.success('数据导入成功，请刷新页面以生效');
            this.importDialogVisible = false;
            this.importPreview = null;
        }
    }
}
</script>

<style lang="scss" scoped>
#aboutUs {
    display: flex;
    justify-content: center;
    height: 80%;
    margin-top: 5%;

    .info-card {
        width: 600px;
        background-color: #FFFFFF;
        border-radius: 24px;
        box-shadow: 0 10px 30px rgba(108, 93, 211, 0.1);
        padding: 40px;
        font-family: 'HarmonyOS Sans SC', '思源黑体', sans-serif;
        text-align: center;
        animation: fadeInUp 0.5s ease-out forwards;
        opacity: 0;
        transform: translateY(20px);

        .logo-section {
            margin-bottom: 40px;

            .app-logo {
                width: 80px;
                height: 80px;
                margin-bottom: 15px;
                border-radius: 16px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }

            .app-name {
                font-size: 28px;
                font-weight: bold;
                color: #333;
                margin: 0 0 10px;
            }

            .app-desc {
                font-size: 16px;
                color: #888;
                margin: 0;
            }
        }

        .content-section {
            text-align: left;
            padding: 0 20px;

            .info-item {
                margin-bottom: 25px;

                .label {
                    font-size: 14px;
                    color: #6C5DD3;
                    font-weight: bold;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .text {
                    font-size: 16px;
                    color: #555;
                    line-height: 1.6;

                    &.contact-email {
                        color: #333;
                        font-weight: 500;
                        font-family: monospace;
                        background: #f5f5f5;
                        padding: 8px 12px;
                        border-radius: 8px;
                        display: inline-block;
                    }
                }

                .sync-actions {
                    margin-top: 10px;
                    display: flex;
                    gap: 10px;
                }

                .font-size-control {
                    display: flex;
                    align-items: center;
                    margin: 10px 0;

                    .font-label {
                        font-size: 14px;
                        color: #888;
                    }

                    .font-value {
                        font-size: 14px;
                        color: #6C5DD3;
                        font-weight: bold;
                        min-width: 36px;
                        text-align: right;
                    }
                }
            }
        }

        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #999;
            font-size: 12px;
        }
    }
}

@keyframes fadeInUp {
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
