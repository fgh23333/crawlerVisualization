<template>
    <div class="chat-container">
        <!-- 标题区 -->
        <header class="chat-header">
            <div class="chat-avatar-bot">
                <el-icon><MagicStick /></el-icon>
            </div>
            <div class="chat-header-text">
                <h1 class="chat-title">思政智能助教</h1>
                <p class="chat-subtitle">基于检索增强（RAG）的高校思政学习智能体</p>
            </div>
        </header>

        <!-- 服务未配置提示 -->
        <el-alert
            v-if="!ragApi"
            class="config-alert"
            type="warning"
            :closable="false"
            show-icon
            title="智能助教服务未配置"
            description="请在环境变量 VITE_RAG_API 中配置检索增强问答服务地址后使用。"
        />

        <!-- 聊天框 -->
        <div class="chat-box" ref="chatBox">
            <!-- 空状态：欢迎语 + 建议问题 -->
            <div v-if="!messages.length" class="welcome">
                <div class="welcome-card">
                    <div class="welcome-emoji">🎓</div>
                    <h2>你好，我是你的思政智能助教</h2>
                    <p>我可以结合九大思政科目的题库与教材，为你检索答疑、梳理重点。试试下面的问题：</p>
                    <div class="suggest-grid">
                        <button
                            v-for="(q, i) in suggestions"
                            :key="i"
                            class="suggest-chip"
                            @click="askSuggestion(q)"
                        >
                            <span class="suggest-icon">💬</span>
                            {{ q }}
                        </button>
                    </div>
                </div>
            </div>

            <template v-for="(msg, index) in messages" :key="'m' + index">
                <el-skeleton v-if="msg.loading" :rows="5" animated></el-skeleton>
                <div v-else class="message-wrapper">
                    <div :class="['message', msg.role]">
                        <div class="msg-avatar" :class="msg.role">
                            <span v-if="msg.role === 'bot'">智</span>
                            <span v-else>我</span>
                        </div>
                        <div class="msg-body">
                            <div class="msg-html" v-html="msg.html"></div>
                            <div v-if="msg.role === 'bot' && msg.sources.length" class="sources">
                                <strong>📚 来源：</strong>
                                <ul>
                                    <li v-for="(source, idx) in msg.sources" :key="idx">{{ source }}</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </div>

        <!-- 输入框 -->
        <div class="input-container">
            <el-select v-model="value" placeholder="" size="large" class="subject-select">
                <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <input
                v-model="inputText"
                @keydown.enter="sendMessage"
                placeholder="请输入您的问题，如：唯物史观的基本内容是什么？"
            />
            <el-button type="primary" @click="sendMessage" :loading="loading" class="send-btn">
                <el-icon v-if="!loading"><Promotion /></el-icon>
                <span v-if="!loading">发送</span>
            </el-button>
        </div>

        <!-- 清空对话 -->
        <div v-if="messages.length" class="chat-toolbar">
            <button class="toolbar-btn" @click="clearMessages">
                <el-icon><Delete /></el-icon> 清空对话
            </button>
            <span class="toolbar-hint">智能助教回答由 AI 生成，仅供参考</span>
        </div>
    </div>
</template>

<script>
import axios from "axios";
import { marked } from "marked";
import { MagicStick, Promotion, Delete } from '@element-plus/icons-vue';

// 检索增强问答服务地址，通过环境变量配置（便于部署与脱敏）
const RAG_API = import.meta.env.VITE_RAG_API || '';

export default {
    data() {
        return {
            ragApi: RAG_API,
            inputText: "",
            messages: [],
            loading: false,
            options: [
                { value: "default", label: "全部" },
                { value: "马克思主义原理", label: "马原" },
                { value: "近代史", label: "近代史" },
                { value: "思想政治", label: "思政" },
                { value: "毛泽东思想概论", label: "毛概" },
                { value: "习近平思想概论", label: "习概" },
                { value: "社会主义历史", label: "社主史" },
                { value: "新中国史", label: "新中国史" },
                { value: "党史", label: "党史" },
                { value: "改革开放史", label: "改开史" },
            ],
            value: "default",
            // 空状态建议问题
            suggestions: [
                "唯物史观和社会意识的关系是什么？",
                "用对比表格梳理新民主主义革命三大法宝",
                "中国式现代化的主要特征有哪些？",
                "帮我出一组马原单选题并给出解析",
            ],
        };
    },
    components: { MagicStick, Promotion, Delete },
    watch: {
        messages() {
            this.$nextTick(this.scrollToBottom);
        },
    },
    methods: {
        scrollToBottom() {
            const el = this.$refs.chatBox;
            if (el) el.scrollTop = el.scrollHeight;
        },
        askSuggestion(text) {
            this.inputText = text;
            this.sendMessage();
        },
        clearMessages() {
            this.messages = [];
        },
        async sendMessage() {
            const text = this.inputText.trim();
            if (!text || this.loading) return;
            if (!RAG_API) {
                this.messages.push({
                    role: "bot",
                    html: "⚠️ 智能助教服务未配置（VITE_RAG_API），暂无法回答。",
                    sources: [],
                });
                return;
            }

            // 用户输入立即显示
            this.messages.push({ role: "user", html: marked.parse(text), sources: [] });

            // 加入骨架屏
            this.messages.push({ role: "bot", html: "", sources: [], loading: true });
            this.loading = true;

            try {
                const { data } = await axios.post(RAG_API, {
                    query: text,
                    subject: this.value,
                });

                // 替换骨架屏
                this.messages.pop();
                this.messages.push({
                    role: "bot",
                    html: marked.parse(data.answer) || "⚠️ 未获取到有效回答",
                    sources: data.sources || [],
                });
            } catch (error) {
                this.messages.pop();
                this.messages.push({
                    role: "bot",
                    html: "❌ 请求失败，请稍后重试",
                    sources: [],
                });
            } finally {
                this.inputText = "";
                this.loading = false;
            }
        },
    },
};
</script>

<style lang="scss" scoped>
.chat-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    height: 90%;
    margin-top: 2%;
}

/* 标题区 */
.chat-header {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 18px;

    .chat-avatar-bot {
        width: 48px;
        height: 48px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #7c6ce8, #5b4fd6);
        color: #fff;
        font-size: 24px;
        box-shadow: 0 8px 22px rgba(108, 93, 211, 0.35);
    }
    .chat-header-text {
        text-align: left;
    }
    .chat-title {
        font-size: 22px;
        font-weight: 800;
        color: #2e2270;
        margin: 0;
        letter-spacing: 0.5px;
    }
    .chat-subtitle {
        font-size: 12.5px;
        color: #8b80c9;
        margin: 2px 0 0;
    }
}

.config-alert {
    width: 100%;
    max-width: 800px;
    margin-bottom: 14px;
}

/* 聊天区 */
.chat-box {
    width: 100%;
    max-width: 820px;
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    text-align: justify;
    scrollbar-width: thin;
}
.chat-box::-webkit-scrollbar { width: 6px; }
.chat-box::-webkit-scrollbar-thumb { background: #d9dcf4; border-radius: 4px; }

/* 欢迎卡片 */
.welcome {
    display: flex;
    justify-content: center;
    padding-top: 20px;

    .welcome-card {
        max-width: 640px;
        text-align: center;
        background: linear-gradient(180deg, #ffffff, #faf9ff);
        border: 1px solid #ececf7;
        border-radius: 22px;
        padding: 32px 28px;
        box-shadow: 0 12px 36px rgba(108, 93, 211, 0.08);

        .welcome-emoji { font-size: 40px; }
        h2 {
            font-size: 19px;
            color: #2e2270;
            margin: 10px 0 6px;
        }
        p {
            font-size: 13.5px;
            color: #64748b;
            line-height: 1.7;
            margin: 0 0 18px;
        }
    }
    .suggest-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
    }
    .suggest-chip {
        display: flex;
        align-items: center;
        gap: 8px;
        text-align: left;
        padding: 11px 14px;
        border-radius: 12px;
        border: 1px solid #ececf7;
        background: #fff;
        color: #475569;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.18s;

        .suggest-icon { font-size: 14px; }
        &:hover {
            border-color: #c4bcf4;
            background: #f5f3ff;
            color: #5b4fd6;
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(108, 93, 211, 0.1);
        }
    }
}

/* 消息 */
.message-wrapper {
    display: flex;
    flex-direction: column;
    margin-bottom: 16px;
    width: 100%;
}
.message {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    word-wrap: break-word;
}
.user {
    flex-direction: row-reverse;

    .msg-body {
        background-color: #6c5dd3;
        color: #fff;
        border-radius: 16px 16px 4px 16px;
        padding: 11px 16px;
        max-width: 78%;
    }
    .msg-avatar { background: linear-gradient(135deg, #8b7cf0, #6c5dd3); color: #fff; }
}
.bot {
    .msg-body {
        background-color: #f4f3fc;
        color: #333;
        border-radius: 16px 16px 16px 4px;
        padding: 11px 16px;
        max-width: 78%;
    }
    .msg-avatar { background: #fff; color: #6c5dd3; border: 1px solid #e0dbfb; }
}
.msg-avatar {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    box-shadow: 0 3px 8px rgba(108, 93, 211, 0.12);
}
.msg-html { line-height: 1.7; }
.msg-html :deep(code) {
    background: rgba(108, 93, 211, 0.08);
    padding: 1px 5px;
    border-radius: 4px;
    font-size: 0.9em;
}
.msg-html :deep(table) {
    border-collapse: collapse;
    margin: 6px 0;
}
.msg-html :deep(th),
.msg-html :deep(td) {
    border: 1px solid #d9dcf4;
    padding: 4px 8px;
}
.sources {
    font-size: 12px;
    color: #7a6cc8;
    margin-top: 8px;
    border-top: 1px dashed #d9dcf4;
    padding-top: 6px;
    ul { margin: 4px 0 0; padding-left: 18px; }
}

/* 输入区 */
.input-container {
    display: flex;
    width: 100%;
    max-width: 820px;
    gap: 10px;
    margin-top: 14px;
    padding: 0 20px;
    box-sizing: border-box;

    .subject-select { width: 110px; flex-shrink: 0; }

    input {
        flex: 1;
        padding: 11px 16px;
        border: 2px solid #ececf7;
        border-radius: 14px;
        outline: none;
        font-size: 15px;
        transition: all 0.3s;
        &:focus {
            border-color: #6c5dd3;
            box-shadow: 0 0 0 3px rgba(108, 93, 211, 0.12);
        }
    }
    .send-btn {
        white-space: nowrap;
        border-radius: 14px;
        padding: 0 22px;
        background: linear-gradient(135deg, #7c6ce8, #5b4fd6);
        border: none;
    }
}

/* 工具栏 */
.chat-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 8px;
    padding: 0 20px;
    max-width: 820px;
    width: 100%;
    box-sizing: border-box;

    .toolbar-btn {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        background: none;
        border: none;
        color: #94a3b8;
        font-size: 12.5px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 8px;
        transition: all 0.15s;
        &:hover { color: #6c5dd3; background: #f5f3ff; }
    }
    .toolbar-hint {
        font-size: 11.5px;
        color: #b8bec9;
    }
}

/* 移动端 */
@media (max-width: 600px) {
    .chat-header .chat-subtitle { display: none; }
    .welcome .suggest-grid { grid-template-columns: 1fr; }
    .input-container .subject-select { width: 88px; }
}
</style>
