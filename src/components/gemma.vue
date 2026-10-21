<template>
    <div class="chat-container">
        <!-- 标题区 -->
        <header class="chat-header">
            <div class="chat-avatar-bot">
                <el-icon><MagicStick /></el-icon>
            </div>
            <div class="chat-header-text">
                <h1 class="chat-title">思政智能助教</h1>
                <p class="chat-subtitle">{{ mode === 'local'
                    ? '端侧离线模式 · Chrome 内置 AI（Beta），无需联网'
                    : '基于检索增强（RAG）的高校思政学习智能体' }}</p>
            </div>
        </header>

        <!-- 模式切换：在线 RAG / 端侧离线（Chrome 内置 AI） -->
        <div class="mode-bar">
            <el-radio-group v-model="mode" size="small" :disabled="loading">
                <el-radio-button value="online">在线 RAG</el-radio-button>
                <el-radio-button value="local" :disabled="!aiStore.isSupported">端侧离线</el-radio-button>
            </el-radio-group>
            <button v-if="mode === 'local' || !aiStore.isSupported" class="mode-diag-btn" @click="aiStore.openDiagnosis">
                {{ mode === 'local' && aiStore.isReady ? '· 本地模型运行中' : aiStore.statusText + '，点此自检' }}
            </button>
        </div>

        <!-- 服务未配置提示 -->
        <el-alert
            v-if="mode === 'online' && !ragApi"
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
                    <p>{{ mode === 'local'
                        ? '当前为端侧离线模式，回答由浏览器内置 AI 在本地生成，全程无需联网。试试下面的问题：'
                        : '我可以结合九大思政科目的题库与教材，为你检索答疑、梳理重点。试试下面的问题：' }}</p>
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
                <el-skeleton v-if="msg.loading && !msg.text" :rows="5" animated></el-skeleton>
                <div v-else class="message-wrapper">
                    <div :class="['message', msg.role]">
                        <div class="msg-avatar" :class="msg.role">
                            <span v-if="msg.role === 'bot'">智</span>
                            <span v-else>我</span>
                        </div>
                        <div class="msg-body">
                            <div class="msg-html" v-html="msg.html"></div>
                            <span v-if="msg.loading && msg.text" class="typing-cursor">▍</span>
                            <div v-if="msg.role === 'bot' && msg.sources.length" class="sources">
                                <strong>📚 来源：</strong>
                                <ul>
                                    <li v-for="(source, idx) in msg.sources" :key="idx">{{ sourceLabel(source) }}</li>
                                </ul>
                            </div>
                            <!-- 回答反馈：👍/👎 各一次，挂到服务端对应 trace -->
                            <div v-if="msg.role === 'bot' && msg.done && msg.traceId && !msg.loading" class="feedback">
                                <button class="feedback-btn" :class="{ active: msg.feedback === 1 }"
                                    :disabled="msg.feedback !== 0" @click="sendFeedback(msg, 1)" title="有帮助">👍</button>
                                <button class="feedback-btn" :class="{ active: msg.feedback === -1 }"
                                    :disabled="msg.feedback !== 0" @click="sendFeedback(msg, -1)" title="没帮助">👎</button>
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
            <el-button v-if="loading" type="warning" plain @click="stopGenerating" class="send-btn stop-btn">
                <el-icon><VideoPause /></el-icon>
                <span>停止</span>
            </el-button>
            <el-button v-else type="primary" @click="sendMessage" class="send-btn">
                <el-icon><Promotion /></el-icon>
                <span>发送</span>
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
import { marked } from "marked";
import { MagicStick, Promotion, Delete, VideoPause } from '@element-plus/icons-vue';
import { useAiStore } from '@/stores/ai';

// 检索增强问答服务地址，通过环境变量配置（便于部署与脱敏）
const RAG_API = import.meta.env.VITE_RAG_API || '';
// /v2/rag 等新端点的基地址（VITE_RAG_API 形如 https://host/rag）
const API_BASE = RAG_API.replace(/\/rag\/?$/, '');

// 会话 id：跨刷新持久，供服务端做会话聚类（可观测性），清空对话时换新
function newSessionId() {
    return typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 's-' + Date.now() + '-' + Math.random().toString(36).slice(2);
}
function loadSessionId() {
    let id = localStorage.getItem('qb_chat_session');
    if (!id) {
        id = newSessionId();
        localStorage.setItem('qb_chat_session', id);
    }
    return id;
}

// 来源展示用的中文名映射
const SUBJECT_NAMES = {
    Marx: '马原', CMH: '近代史', Political: '思政', MaoIntro: '毛概', XiIntro: '习概',
    SDH: '社主史', NCH: '新中国史', CCPH: '党史', ORH: '改开史',
};
const TYPE_NAMES = {
    singleChoice: '单选', multipleChoice: '多选', rightWrong: '判断', fillingBlank: '填空',
};

export default {
    setup() {
        return { aiStore: useAiStore() };
    },
    data() {
        return {
            ragApi: RAG_API,
            mode: 'online',  // online=远端 RAG / local=端侧离线（Chrome 内置 AI，Beta）
            inputText: "",
            messages: [],
            loading: false,
            abortCtrl: null,
            sessionId: loadSessionId(),
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
    components: { MagicStick, Promotion, Delete, VideoPause },
    watch: {
        messages: {
            handler() {
                this.$nextTick(this.scrollToBottom);
            },
            deep: true, // 流式输出时消息内容持续变化也要跟随滚动
        },
        // 模式切换：清空对话并重置端侧会话（两套上下文互不污染）
        mode() {
            this.messages = [];
            this.aiStore.resetChatSession();
        },
    },
    beforeUnmount() {
        // 离开聊天页：中断进行中的生成并释放端侧会话显存
        this.stopGenerating();
        this.aiStore.resetChatSession();
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
            if (this.mode === 'local') {
                // 端侧模式：销毁会话即真正清空多轮记忆
                this.aiStore.resetChatSession();
            } else {
                // 新会话：服务端按 sessionId 聚类对话
                this.sessionId = newSessionId();
                localStorage.setItem('qb_chat_session', this.sessionId);
            }
        },
        // 流式渲染节流：delta 很密，marked.parse 每帧全量跑会卡
        scheduleParse(msg) {
            if (this._parseTimer) return;
            this._parseTimer = setTimeout(() => {
                this._parseTimer = null;
                msg.html = marked.parse(msg.text || '');
            }, 100);
        },
        stopGenerating() {
            if (this.mode === 'local') this.aiStore.abortChat();
            else if (this.abortCtrl) this.abortCtrl.abort();
        },
        sourceLabel(s) {
            const subject = SUBJECT_NAMES[s.subject] || s.subject || '';
            const type = TYPE_NAMES[s.type] || s.type || '';
            return `【${[subject, type].filter(Boolean).join('·')}】${s.stem || ''}`;
        },
        async sendFeedback(msg, score) {
            if (msg.feedback) return; // 每条消息只能反馈一次
            msg.feedback = score; // 乐观更新，失败不回滚（不打扰用户）
            try {
                await fetch(`${API_BASE}/feedback`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ traceId: msg.traceId, sessionId: this.sessionId, score }),
                });
            } catch { /* 静默失败 */ }
        },
        // 解析 SSE 流：按空行分帧，event:/data: 两行一组
        async consumeSSE(res, msg) {
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buf = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buf += decoder.decode(value, { stream: true });
                let idx;
                while ((idx = buf.indexOf('\n\n')) >= 0) {
                    const frame = buf.slice(0, idx);
                    buf = buf.slice(idx + 2);
                    const evName = (frame.match(/^event: (.+)$/m) || [])[1];
                    const dataLine = (frame.match(/^data: (.+)$/m) || [])[1];
                    if (!evName || !dataLine) continue;
                    let obj;
                    try { obj = JSON.parse(dataLine); } catch { continue; }
                    this.handleSSEEvent(evName, obj, msg);
                }
            }
            // 流结束仍未 done 事件（异常断流）→ 兜底渲染
            if (!msg.done) {
                msg.loading = false;
                if (msg.text) msg.html = marked.parse(msg.text);
                else msg.html = "⚠️ 连接中断，请重试";
            }
        },
        handleSSEEvent(name, obj, msg) {
            if (name === 'meta') {
                msg.traceId = obj.traceId;
            } else if (name === 'sources') {
                msg.sources = obj.sources || [];
            } else if (name === 'delta') {
                msg.text += obj.text || '';
                this.scheduleParse(msg);
            } else if (name === 'done') {
                msg.done = true;
                msg.loading = false;
                msg.html = marked.parse(msg.text || '');
            } else if (name === 'error') {
                msg.done = true;
                msg.loading = false;
                msg.html = `⚠️ ${obj.message || '回答生成失败，请稍后重试'}`;
            }
        },
        async sendMessage() {
            // 端侧离线模式走本地模型，不入 RAG 通道
            if (this.mode === 'local') return this.sendLocalMessage();
            const text = this.inputText.trim();
            if (!text || this.loading) return;
            if (!RAG_API) {
                this.messages.push({
                    role: "bot",
                    html: "⚠️ 智能助教服务未配置（VITE_RAG_API），暂无法回答。",
                    sources: [],
                    text: "",
                });
                return;
            }

            // 用户输入立即显示
            this.messages.push({ role: "user", html: marked.parse(text), text, sources: [] });

            // 占位消息（流式填充）
            const msg = {
                role: "bot", html: "", text: "", sources: [],
                loading: true, done: false, traceId: null, feedback: 0,
            };
            this.messages.push(msg);
            this.loading = true;
            this.inputText = "";

            // 历史上下文：最近 6 轮（服务端做多轮指代消解）
            const history = this.messages
                .slice(0, -2)
                .filter(m => m.text && m.text.trim())
                .map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text.slice(0, 2000) }))
                .slice(-6);

            this.abortCtrl = new AbortController();
            try {
                const res = await fetch(`${API_BASE}/v2/rag`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    signal: this.abortCtrl.signal,
                    body: JSON.stringify({
                        query: text,
                        subject: this.value,
                        sessionId: this.sessionId,
                        history,
                    }),
                });

                if (!res.ok) {
                    let message = `请求失败（${res.status}）`;
                    try {
                        const j = await res.json();
                        message = (j.error && j.error.message) || message;
                    } catch { /* 非 JSON 错误体 */ }
                    if (res.status === 429) message = "提问太频繁啦，休息一下再试～";
                    msg.html = `⚠️ ${message}`;
                    msg.loading = false;
                    msg.done = true;
                    return;
                }

                await this.consumeSSE(res, msg);
            } catch (error) {
                if (error.name === 'AbortError') {
                    // 用户主动停止：保留已生成内容
                    msg.loading = false;
                    msg.done = true;
                    msg.html = marked.parse(msg.text || '') + '\n\n*（已停止生成）*';
                } else {
                    msg.html = "❌ 网络异常，请稍后重试";
                    msg.loading = false;
                    msg.done = true;
                }
            } finally {
                this.loading = false;
                this.abortCtrl = null;
            }
        },
        // ======================== 端侧离线模式（Chrome 内置 AI，Beta） ========================
        // 复用消息结构 / 流式节流 / 骨架屏；不设 traceId → 👍/👎 反馈区自动隐藏
        async sendLocalMessage() {
            const text = this.inputText.trim();
            if (!text || this.loading) return;
            // 环境不支持时开关置灰，正常到不了这里；防御性兜底弹自检。
            // after-download 首条消息由 create() 自动触发权重下载（进度见角标/自检弹窗）
            if (!this.aiStore.isSupported) {
                this.aiStore.openDiagnosis();
                return;
            }

            // 用户输入立即显示
            this.messages.push({ role: "user", html: marked.parse(text), text, sources: [] });

            // 占位消息（流式填充）
            const msg = {
                role: "bot", html: "", text: "", sources: [],
                loading: true, done: false, traceId: null, feedback: 0,
            };
            this.messages.push(msg);
            this.loading = true;
            this.inputText = "";

            try {
                const { aborted } = await this.aiStore.chat(text, {
                    onDelta: (_chunk, full) => {
                        msg.text = full;
                        this.scheduleParse(msg);
                    },
                });
                msg.done = true;
                msg.loading = false;
                msg.html = marked.parse(msg.text || '') + (aborted && msg.text ? '\n\n*（已停止生成）*' : '');
                if (aborted && !msg.text) msg.html = '⚠️ 已停止生成';
            } catch (e) {
                msg.done = true;
                msg.loading = false;
                msg.html = `⚠️ ${e?.message || '端侧 AI 回答失败'}`;
            } finally {
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

/* 模式切换条（在线 RAG / 端侧离线） */
.mode-bar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    width: 100%;
    max-width: 820px;
    margin-bottom: 14px;

    .mode-diag-btn {
        background: none;
        border: 1px dashed #d9dcf4;
        border-radius: 12px;
        color: #8b80c9;
        font-size: 12px;
        padding: 4px 10px;
        cursor: pointer;
        transition: all 0.15s;

        &:hover {
            color: #6c5dd3;
            border-color: #c4bcf4;
            background: #f5f3ff;
        }
    }
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

/* 端侧流式生成时的打字机光标 */
.typing-cursor {
    display: inline-block;
    color: #6c5dd3;
    animation: typing-blink 0.8s infinite;
}
@keyframes typing-blink {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0;
    }
}
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

/* 回答反馈 */
.feedback {
    margin-top: 6px;
    display: flex;
    gap: 6px;

    .feedback-btn {
        background: #fff;
        border: 1px solid #ececf7;
        border-radius: 8px;
        font-size: 13px;
        padding: 2px 8px;
        cursor: pointer;
        transition: all 0.15s;
        &:hover:not(:disabled) { border-color: #c4bcf4; background: #f5f3ff; }
        &:disabled { cursor: default; opacity: 0.55; }
        &.active { border-color: #6c5dd3; background: #f5f3ff; }
    }
}

/* 停止按钮 */
.stop-btn {
    white-space: nowrap;
    border-radius: 14px;
    padding: 0 22px;
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
