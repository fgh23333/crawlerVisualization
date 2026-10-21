import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  checkPromptAvailability, checkSummarizerAvailability,
  createChatSession, destroySession, streamChat,
  GEMMA_SYSTEM_PROMPT, buildPersonalizedSystemPrompt,
} from '@/utils/builtinAI'

// 原生 session / AbortController 一律以模块级普通变量持有：
// 被 Pinia/Vue 响应式 Proxy 包裹会对原生对象产生 Illegal invocation
let chatSession = null   // 聊天通道：长生命周期会话（端侧多轮记忆在 session 内）
let chatBusy = false
let chatAbort = null
let taskBusy = false     // 任务通道：一次性短会话（剖析/归纳共用，busy 锁串行）
let taskAbort = null
let downloadPollTimer = null // 下载态轮询定时器（见 startDownloadPolling）

// 个性化剖析缓存容量控制（AI 输出只缓存剖析/归纳结果，LRU 淘汰，防止 localStorage 膨胀）
const ANALYSIS_CACHE_LIMIT = 30
const ANALYSIS_TEXT_LIMIT = 2000
const SUMMARY_CACHE_LIMIT = 5
const SUMMARY_TEXT_LIMIT = 4000
// 剖析缓存版本：prompt 改版（如篇幅调整）时 +1，旧版本缓存自动失效
const ANALYSIS_CACHE_VERSION = 4

/**
 * 端侧 AI 全局状态与双通道会话管理
 * 聊天通道：gemma 端侧模式专用长会话；任务通道：题目剖析/收藏归纳一次性会话
 * profile（个性化画像）持久化到用户 localStorage —— 越用越懂用户，数据不出本地
 */
export const useAiStore = defineStore('ai', () => {
  // ======================== 响应式状态 ========================
  // checking | available | after-download | downloading | unsupported
  const status = ref('checking')
  const downloadProgress = ref(0) // 0~1，模型权重静默下载进度
  const summarizerStatus = ref('checking')
  const diagVisible = ref(false)  // 全站唯一自检弹窗开关（newHome 挂载实例）

  // AI native 个性化画像：科目关注计数 / 累计剖析数 / 聊天轮数 / 剖析与归纳缓存（LRU）
  const profile = ref({
    subjectInterest: {},
    analysisCount: 0,
    chatTurns: 0,
    analysisCache: {}, // { [questionId 或 id@用户作答]: { text, ts } }
    summaryCache: {},  // { [列表签名]: { text, ts } } 归纳结果按题目列表指纹缓存
  })

  // ======================== 派生状态 ========================

  const isReady = computed(() => status.value === 'available')

  // 环境级支持（接口已暴露）：available / after-download / downloading 皆算支持。
  // unsupported（含检测中）不提供任何 AI 入口；after-download 首次使用会由
  // create() 自动触发权重下载，进度经 monitor 回调实时回传（见 downloadProgress）。
  const isSupported = computed(() =>
    status.value === 'available' || status.value === 'after-download' || status.value === 'downloading')

  const statusText = computed(() => {
    switch (status.value) {
      case 'available': return '端侧 AI 就绪'
      case 'after-download': return '端侧 AI 可用（需下载模型）'
      case 'downloading': {
        // <1% 保留一位小数：多 GB 权重下载初期整数恒为 0%，一位小数才能看出进度在动
        const pct = downloadProgress.value * 100
        const shown = downloadProgress.value <= 0 ? '' : pct < 1 ? ` ${pct.toFixed(1)}%` : ` ${Math.round(pct)}%`
        return `模型下载中${shown}`
      }
      case 'unsupported': return '当前浏览器不支持端侧 AI'
      default: return '正在检测端侧 AI…'
    }
  })

  // 侧边栏角标四态：检测中(灰) / 就绪(绿) / 需下载或下载中(黄) / 不支持(红)
  const dotClass = computed(() => {
    if (status.value === 'available') return 'ok'
    if (status.value === 'unsupported') return 'error'
    if (status.value === 'after-download' || status.value === 'downloading') return 'warn'
    return 'checking'
  })

  // ======================== 环境检测 ========================

  /** 检测端侧 AI 环境（全静默容错，绝不影响宿主页面） */
  async function checkEnvironment() {
    status.value = 'checking'
    summarizerStatus.value = 'checking'
    try {
      status.value = await checkPromptAvailability()
    } catch {
      status.value = 'unsupported'
    }
    try {
      summarizerStatus.value = await checkSummarizerAvailability()
    } catch {
      summarizerStatus.value = 'unsupported'
    }
    if (status.value === 'available') downloadProgress.value = 1
    // 浏览器后台下载（components 页触发）无 monitor 可挂 → 轮询感知完成
    if (status.value === 'downloading') startDownloadPolling()
  }

  /** 呼出自检弹窗并强制重新检测 */
  function openDiagnosis() {
    diagVisible.value = true
    checkEnvironment()
  }

  // ======================== 个性化画像（AI native） ========================

  /** 记录一次科目关注（提问/剖析/归纳时调用，键为科目缩写或中文名均可） */
  function recordSubjectFocus(subjectKey) {
    if (!subjectKey) return
    profile.value.subjectInterest[subjectKey] = (profile.value.subjectInterest[subjectKey] || 0) + 1
  }

  /** 读取历史剖析缓存（命中则秒出，免重复推理）；key 为题目 id，练习模式下带 @用户作答 后缀 */
  function getCachedAnalysis(key) {
    const hit = profile.value.analysisCache?.[key]
    // 版本不匹配（prompt 改版前后的旧输出）视为未命中，按当前版 prompt 重新生成
    return hit?.v === ANALYSIS_CACHE_VERSION ? hit.text : ''
  }

  /** 写入剖析结果并更新画像计数（LRU 超限淘汰最旧） */
  function recordAnalysis(key, text) {
    profile.value.analysisCount += 1
    const cache = profile.value.analysisCache
    cache[key] = { v: ANALYSIS_CACHE_VERSION, text: String(text).slice(0, ANALYSIS_TEXT_LIMIT), ts: Date.now() }
    const keys = Object.keys(cache)
    if (keys.length > ANALYSIS_CACHE_LIMIT) {
      keys.sort((a, b) => cache[a].ts - cache[b].ts)
        .slice(0, keys.length - ANALYSIS_CACHE_LIMIT)
        .forEach(k => { delete cache[k] })
    }
  }

  /** 读取归纳缓存（列表签名一致时秒出；签名含题目 id 与累计错误数，列表/错题一变即自动失效） */
  function getCachedSummary(signature) {
    return profile.value.summaryCache?.[signature]?.text || ''
  }

  /** 写入归纳结果（LRU 超限淘汰最旧；旧版本持久化数据无 summaryCache 字段时自动补建） */
  function recordSummary(signature, text) {
    const cache = profile.value.summaryCache ||= {}
    cache[signature] = { text: String(text).slice(0, SUMMARY_TEXT_LIMIT), ts: Date.now() }
    const keys = Object.keys(cache)
    if (keys.length > SUMMARY_CACHE_LIMIT) {
      keys.sort((a, b) => cache[a].ts - cache[b].ts)
        .slice(0, keys.length - SUMMARY_CACHE_LIMIT)
        .forEach(k => { delete cache[k] })
    }
  }

  function recordChatTurn() {
    profile.value.chatTurns += 1
  }

  /** 个性化人设（含本地画像上下文），会话创建时注入 */
  function personalizedPrompt() {
    return buildPersonalizedSystemPrompt(GEMMA_SYSTEM_PROMPT, profile.value)
  }

  // ======================== 会话内部工具 ========================

  // 下载态轮询：downloadprogress 事件只在我们自己 create() 挂的 monitor 上有；
  // 后台下载 / monitor 随「停止」或切页断开后，页面会永远卡在「下载中 X%」。
  // 每 10s 静默探一次 availability，完成即翻 available（无百分比，仅终态）。
  function startDownloadPolling() {
    if (downloadPollTimer) return
    downloadPollTimer = setInterval(async () => {
      if (status.value !== 'downloading') { stopDownloadPolling(); return }
      try {
        const s = await checkPromptAvailability()
        if (s !== 'downloading') {
          status.value = s
          if (s === 'available') downloadProgress.value = 1
          stopDownloadPolling()
        }
      } catch { /* 静默容错，下一轮再探 */ }
    }, 10000)
  }

  function stopDownloadPolling() {
    if (downloadPollTimer) { clearInterval(downloadPollTimer); downloadPollTimer = null }
  }

  // 模型权重静默下载进度 → 状态机联动（供聊天/任务两通道共用）
  function makeProgressWatcher() {
    return (p) => {
      downloadProgress.value = p
      if (status.value !== 'available') {
        status.value = p >= 1 ? 'available' : 'downloading'
        if (status.value === 'downloading') startDownloadPolling()
      }
    }
  }

  function ensureChatSession(signal) {
    if (chatSession) return Promise.resolve(chatSession)
    return createChatSession({
      systemPrompt: personalizedPrompt(),
      signal,
      onDownloadProgress: makeProgressWatcher(),
    }).then((s) => {
      chatSession = s
      status.value = 'available'
      downloadProgress.value = 1
      return s
    })
  }

  // ======================== 聊天通道（gemma 端侧模式） ========================

  /**
   * 端侧多轮聊天：流式回调 onDelta(chunk, fullSoFar)
   * @returns {Promise<{ text: string, aborted: boolean }>} 中止时 aborted=true（流式内容调用方已持有）
   */
  async function chat(prompt, { onDelta } = {}) {
    if (chatBusy) throw new Error('端侧 AI 正在回复上一条消息')
    chatBusy = true
    chatAbort = new AbortController()
    try {
      const session = await ensureChatSession(chatAbort.signal)
      const text = await streamChat(session, prompt, { onDelta, signal: chatAbort.signal })
      recordChatTurn()
      return { text, aborted: false }
    } catch (err) {
      if (err?.name === 'AbortError') return { text: '', aborted: true }
      // 会话失效（如被浏览器回收）→ 丢弃旧会话，下次调用重建
      if (chatSession) {
        destroySession(chatSession)
        chatSession = null
      }
      throw err
    } finally {
      chatBusy = false
      chatAbort = null
    }
  }

  // ======================== 任务通道（剖析/归纳，一次性会话） ========================

  /**
   * 一次性 AI 任务：create → stream → destroy（finally 必销毁）
   * @returns {Promise<{ text: string, aborted: boolean }>}
   */
  async function runTask(prompt, { onDelta } = {}) {
    if (taskBusy) throw new Error('上一条 AI 任务还在生成中')
    taskBusy = true
    taskAbort = new AbortController()
    let session = null
    try {
      session = await createChatSession({
        systemPrompt: personalizedPrompt(),
        signal: taskAbort.signal,
        onDownloadProgress: makeProgressWatcher(),
      })
      status.value = 'available'
      downloadProgress.value = 1
      const text = await streamChat(session, prompt, { onDelta, signal: taskAbort.signal })
      return { text, aborted: false }
    } catch (err) {
      if (err?.name === 'AbortError') return { text: '', aborted: true }
      throw err
    } finally {
      destroySession(session)
      taskBusy = false
      taskAbort = null
    }
  }

  // ======================== 中断与会话管理 ========================

  function abortChat() { chatAbort?.abort() }
  function abortTask() { taskAbort?.abort() }

  /** 销毁聊天会话（清空对话/离开 chat 页时调用，释放显存） */
  function resetChatSession() {
    abortChat()
    destroySession(chatSession)
    chatSession = null
  }

  return {
    // 状态
    status, downloadProgress, summarizerStatus, diagVisible, profile,
    // 派生
    isReady, isSupported, statusText, dotClass,
    // 检测
    checkEnvironment, openDiagnosis, stopDownloadPolling,
    // 画像
    recordSubjectFocus, getCachedAnalysis, recordAnalysis, getCachedSummary, recordSummary, recordChatTurn,
    // 通道
    chat, runTask,
    // 管理
    abortChat, abortTask, resetChatSession,
  }
}, {
  // 仅持久化个性化画像（运行时状态刷新后重检测即可，秒级完成）
  persist: { pick: ['profile'] },
})
