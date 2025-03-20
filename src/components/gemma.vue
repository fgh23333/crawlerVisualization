<template>
    <div class="chat-container">
        <!-- 标题 -->
        <header class="chat-header">Gemma AI Chat</header>

        <!-- 聊天框 -->
        <div class="chat-box">
            <template v-for="(msg, index) in messages">
                <el-skeleton v-if="msg.loading" :key="'skeleton-' + index" :rows="5" animated></el-skeleton>
                <div v-else :key="'message-' + index" class="message-wrapper">
                    <div :class="['message', msg.role]">
                        <div v-html="msg.html"></div>
                        <div v-if="msg.role === 'bot' && msg.sources.length" class="sources">
                            <strong>来源：</strong>
                            <ul>
                                <li v-for="(source, idx) in msg.sources" :key="'source-' + index + '-' + idx">
                                    {{ source }}
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </template>
        </div>

        <!-- 输入框 -->
        <div class="input-container">
            <input v-model="inputText" @keydown.enter="sendMessage" placeholder="请输入您的问题..." />
            <el-button type="primary" @click="sendMessage" :loading="loading">发送</el-button>
        </div>
    </div>
</template>

<script>
import axios from "axios";
import { marked } from "marked";

export default {
    data() {
        return {
            inputText: "",
            messages: [],
            loading: false
        };
    },
    methods: {
        async sendMessage() {
            if (!this.inputText.trim() || this.loading) return;

            // 用户输入立即显示
            this.messages.push({ role: "user", html: marked(this.inputText), sources: [] });

            // 加入骨架屏
            this.messages.push({ role: "bot", html: "", sources: [], loading: true });

            this.loading = true;
            try {
                const { data } = await axios.post("https://rag-api.635262140.xyz/rag", {
                    query: this.inputText
                });

                // 替换骨架屏
                this.messages.pop();
                this.messages.push({
                    role: "bot",
                    html: data.answers?.length ? marked(data.answers.join("\n\n")) : "⚠️ 未获取到有效回答",
                    sources: data.sources || [],
                    loading: false
                });
            } catch (error) {
                this.messages.pop();
                this.messages.push({ role: "bot", html: "❌ 请求失败，请稍后重试", sources: [], loading: false });
            } finally {
                this.inputText = "";
                this.loading = false;
            }
        }
    }
};
</script>

<style lang="less" scoped>
.chat-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: calc(100vh - 40px);
    background-color: white;
    padding: 20px;
}

.chat-header {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 16px;
}

.chat-box {
    width: 100%;
    max-width: 600px;
    height: 600px;
    overflow-y: auto;
    border: 1px solid #ddd;
    padding: 16px;
    border-radius: 8px;
    background-color: #f9f9f9;
    text-align: justify;
}

.message-wrapper {
    display: flex;
    flex-direction: column;
    margin-bottom: 10px;
    width: 100%;
}

.message {
    border-radius: 20px;
    word-wrap: break-word;
}

.user {
    background-color: #007bff;
    color: #fff;
    align-self: flex-end;
    border-radius: 20px;
    padding: 10px 20px;
    width: fit-content;
    max-width: 80%;
}

.bot {
    background-color: #f1f1f1;
    color: #333;
    align-self: flex-start;
    border-radius: 20px;
    padding: 10px 20px;
    width: fit-content;
    max-width: 80%;
}

.sources {
    font-size: 12px;
    color: #666;
}

.input-container {
    display: flex;
    width: 100%;
    max-width: 600px;
    gap: 8px;
    margin-top: 16px;
}

input {
    flex: 1;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    outline: none;
    font-size: 16px;
    white-space: pre-wrap;
}

.el-button {
    white-space: nowrap;
}
</style>