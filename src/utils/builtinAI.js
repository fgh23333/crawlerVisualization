/**
 * Chrome 内置 AI（Built-in AI）工具封装
 * 端侧 Gemma 模型（Prompt API）与 Summarizer API 的互操作层：
 * 双形态兼容（window.LanguageModel 新标准 / window.ai.languageModel 旧形态）、
 * 能力检测、会话生命周期、命令式流式消费、业务 Prompt 构造。
 *
 * 本模块无状态：不持有会话、不感知 Pinia，会话与回调均由调用方显式传入。
 * 所有检测函数在环境不支持时静默返回「不支持」结果，绝不抛错影响宿主页面。
 */

// 思政科目缩写 → 中文名（favorites 归纳分组 / 剖析 prompt 共用）
export const SUBJECT_NAMES = {
  Marx: '马原', CMH: '近代史', Political: '思政', MaoIntro: '毛概', XiIntro: '习概',
  SDH: '社主史', NCH: '新中国史', CCPH: '党史', ORH: '改开史',
};

// availability 原始值 → 项目统一状态机
// 'checking' 仅存在于 store 初始态，不在此映射
const AVAILABILITY_MAP = {
  unavailable: 'unsupported',   // 接口在但模型/硬件不可用
  downloadable: 'after-download', // 需要下载模型权重
  downloading: 'downloading',   // 模型下载中
  available: 'available',       // 就绪
};

// ======================== API 入口（双形态兼容） ========================

/**
 * 获取 Prompt API 入口对象
 * @returns {Object|null} 新标准 window.LanguageModel，回退旧形态 window.ai.languageModel，均无返回 null
 */
export function getPromptAPI() {
  if (typeof window === 'undefined') return null;
  return window.LanguageModel || window.ai?.languageModel || null;
}

/**
 * 获取 Summarizer API 入口对象
 * @returns {Object|null}
 */
export function getSummarizerAPI() {
  if (typeof window === 'undefined') return null;
  return window.Summarizer || window.ai?.summarizer || null;
}

// ======================== 能力检测 ========================

/**
 * 是否支持 WebGPU（端侧推理的硬件加速路径，仅用于诊断展示）
 */
export function hasWebGPU() {
  return typeof navigator !== 'undefined' && !!navigator.gpu;
}

/**
 * 解析浏览器内核与主版本（用于诊断「需 Chromium >= 128」）
 * 优先 navigator.userAgentData.brands（UA-CH，可靠），无则回退 UA 正则。
 * @returns {{ isChromium: boolean, version: number }}
 */
export function getBrowserInfo() {
  const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
  let isChromium = /Chrome\/\d+/.test(ua) || /Chromium\/\d+/.test(ua);
  let version = 0;
  const m = ua.match(/(?:Chrome|Chromium)\/(\d+)/);
  if (m) version = parseInt(m[1], 10) || 0;

  const uad = typeof navigator !== 'undefined' && navigator.userAgentData;
  if (uad && Array.isArray(uad.brands) && uad.brands.length) {
    // brands 含多条（Chromium / Google Chrome / Microsoft Edge），取数值最大版本
    const nums = uad.brands.map(b => parseInt(b.version, 10)).filter(v => !Number.isNaN(v));
    if (nums.length) {
      isChromium = true;
      version = Math.max(...nums);
    }
  }
  return { isChromium, version };
}

/**
 * 查询 Prompt API 可用状态（映射为项目状态机取值）
 * @returns {Promise<string>} 'available' | 'after-download' | 'downloading' | 'unsupported'
 */
export async function checkPromptAvailability() {
  const api = getPromptAPI();
  if (!api) return 'unsupported';
  try {
    const raw = await api.availability();
    return AVAILABILITY_MAP[raw] || 'unsupported';
  } catch {
    // 接口暴露但调用异常（如权限未开），按不支持处理
    return 'unsupported';
  }
}

/**
 * 查询 Summarizer API 可用状态（同上映射）
 */
export async function checkSummarizerAvailability() {
  const api = getSummarizerAPI();
  if (!api) return 'unsupported';
  try {
    const raw = await api.availability();
    return AVAILABILITY_MAP[raw] || 'unsupported';
  } catch {
    return 'unsupported';
  }
}

// ======================== 会话生命周期 ========================

/**
 * 创建端侧聊天会话
 * @param {Object} opts
 * @param {string} opts.systemPrompt - 系统人设（initialPrompts 注入）
 * @param {AbortSignal} [opts.signal] - 创建阶段的中断信号
 * @param {Function} [opts.onDownloadProgress] - 模型权重静默下载进度回调，参数为 0~1 小数
 * @returns {Promise<Object>} 原生 session（调用方以普通变量持有，勿放入响应式系统）
 */
export async function createChatSession({ systemPrompt = '', signal, onDownloadProgress } = {}) {
  const api = getPromptAPI();
  if (!api) throw new Error('当前浏览器不支持内置 AI（Prompt API 未暴露）');

  const base = {
    initialPrompts: [{ role: 'system', content: systemPrompt }],
    signal,
  };
  if (typeof onDownloadProgress === 'function') {
    base.monitor = (mon) => {
      mon.addEventListener('downloadprogress', (e) => onDownloadProgress(e.loaded));
    };
  }

  try {
    // samplingMode 属 origin trial 参数：贪婪采样可激活 Gemma MTP 投机解码加速
    return await api.create({ ...base, samplingMode: 'most-predictable' });
  } catch (err) {
    if (err instanceof TypeError) {
      // 当前形态不识别该参数（非 OT 环境）→ 去参重试一次
      return await api.create(base);
    }
    throw err;
  }
}

/**
 * 销毁会话释放显存（安全调用，任何入参都不抛错）
 * @param {Object|null} session
 */
export function destroySession(session) {
  try {
    session?.destroy?.();
  } catch {
    // 会话已失效等情况，忽略
  }
}

// ======================== 流式消费 ========================

/**
 * 内部共用：命令式消费 ReadableStream，逐段解码回调
 * @param {ReadableStream} stream
 * @param {Function} [onDelta] - (chunk, fullSoFar)
 * @returns {Promise<string>} 完整拼接文本
 */
async function consumeStream(stream, onDelta) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let full = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      // 双形态兼容：新形态 promptStreaming 直接给 string chunk，旧形态给 Uint8Array
      const chunk = typeof value === 'string' ? value : decoder.decode(value, { stream: true });
      if (!chunk) continue;
      full += chunk;
      if (onDelta) onDelta(chunk, full);
    }
    // 冲刷解码器：多字节字符跨 chunk 时缓冲区可能残留尾字节
    const tail = decoder.decode();
    if (tail) {
      full += tail;
      if (onDelta) onDelta(tail, full);
    }
  } catch (err) {
    if (err?.name === 'AbortError') {
      // 中止时保留已拼接内容由调用方决定，这里规范化错误后上抛
      const abortErr = new Error('已中止生成');
      abortErr.name = 'AbortError';
      throw abortErr;
    }
    throw err;
  }
  return full;
}

/**
 * 端侧会话流式问答
 * @param {Object} session - createChatSession 返回的原生会话
 * @param {string} text - 用户输入
 * @param {Object} [opts]
 * @param {Function} [opts.onDelta] - 增量回调 (chunk, fullSoFar)
 * @param {AbortSignal} [opts.signal] - 中断信号；中止时上抛 name 为 'AbortError' 的错误
 * @returns {Promise<string>} 完整回答文本
 */
export async function streamChat(session, text, { onDelta, signal } = {}) {
  const stream = session.promptStreaming(text, { signal });
  return consumeStream(stream, onDelta);
}

/**
 * Summarizer API 一次性摘要（备用通道：当前业务主路径用 LanguageModel）
 * @param {Object} opts - { type, format, length, input, onDelta, signal }
 * @returns {Promise<string>} 摘要全文
 */
export async function summarizeOnce({ type = 'key-points', format = 'markdown', length = 'medium', input = '', onDelta, signal } = {}) {
  const api = getSummarizerAPI();
  if (!api) throw new Error('当前浏览器不支持 Summarizer API');
  const session = await api.create({ type, format, length });
  try {
    const stream = session.summarizeStreaming(input, { signal });
    return await consumeStream(stream, onDelta);
  } finally {
    destroySession(session);
  }
}

// ======================== 业务 Prompt 构造（纯函数，可单测） ========================

// 端侧思政助教人设：端侧模型容量有限，指令保持紧凑
export const GEMMA_SYSTEM_PROMPT = [
  '你是题库系统的思政学习助教，运行在用户浏览器本地，离线可用。',
  '要求：用简体中文回答；条理清晰，可用 Markdown 列表与表格；',
  '内容围绕政治理论课知识（马原、近代史、毛概、习概等）；',
  '不确定的内容如实说明，不编造；回答保持简洁。',
].join('');

/**
 * 基于本地个性化画像生成动态人设（AI native：越用越懂用户）
 * @param {string} basePrompt - GEMMA_SYSTEM_PROMPT 等基础人设
 * @param {Object} profile - { subjectInterest: {Marx: 12,...}, analysisCount: number, chatTurns: number }
 * @returns {string} 无个性化数据时原样返回 basePrompt
 */
export function buildPersonalizedSystemPrompt(basePrompt, profile) {
  if (!profile) return basePrompt;
  const interests = Object.entries(profile.subjectInterest || {})
    .filter(([, n]) => Number(n) > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k, n]) => `${SUBJECT_NAMES[k] || k}×${n}`)
    .join('、');
  const analysisCount = Number(profile.analysisCount) || 0;
  if (!interests && analysisCount < 1) return basePrompt;

  const lines = [basePrompt, '', '【用户画像（仅存于用户本地浏览器）】'];
  if (interests) lines.push(`近期重点关注：${interests}，优先照顾这些科目的讲解深度。`);
  if (analysisCount > 0) lines.push(`已累计为用户解析 ${analysisCount} 道题，请延续此前的讲解风格。`);
  return lines.join('\n');
}

/**
 * 构造单题剖析 prompt（较完整篇幅：逐项解析每个选项，含判定依据与记忆要点）
 * @param {Object} question - 题目对象（questionStem/option/answer）
 * @param {Object} [meta] - { typeLabel: 题型中文, subjectLabel: 科目中文, userAnswer: 用户作答 }
 * @returns {string}
 */
export function buildQuestionAnalysisPrompt(question, { typeLabel = '', subjectLabel = '', userAnswer = '' } = {}) {
  const q = question || {};
  const lines = [];
  lines.push('请解析下面这道题：用简体中文 Markdown 输出，全文控制在 400 字以内，按三部分写：');
  lines.push('1. **考点**：一两句点明考查的知识点；2. **逐项解析**：每个选项单独一行，格式「A（对/错）：原因」，正确选项要讲清为什么对；3. **易错**：一两句点出易混淆点与记忆要点。');
  lines.push('判断/填空题没有选项，第 2 部分改为分点讲清判定依据与相关知识。不要小标题，不要超出篇幅。');
  const meta = [];
  if (subjectLabel) meta.push(`科目：${subjectLabel}`);
  if (typeLabel) meta.push(`题型：${typeLabel}`);
  if (meta.length) lines.push(meta.join('，'));
  lines.push(`题目：${q.questionStem || ''}`);
  const opts = Array.isArray(q.option) ? q.option : [];
  if (opts.length) {
    lines.push(opts.map((o, i) => `${'ABCDEFGH'[i] || i}、${o}`).join('\n'));
  }
  lines.push(`正确答案：${q.answer ?? ''}`);
  if (userAnswer) lines.push(`我的作答：${userAnswer}`);
  lines.push('请开始解析：');
  return lines.join('\n');
}

/**
 * 构造收藏/错题归纳 prompt（调用方按科目分组后传入）
 * @param {Array<Object>} groups - [{ subject, total, highFreq, errorTotal, sampleStems }]
 * @returns {string}
 */
export function buildFavoritesSummaryPrompt(groups) {
  const parts = [];
  parts.push('以下是我的题库收藏与错题按科目分组统计，请用简体中文 Markdown 输出：');
  parts.push('1. 每个科目的考点分布与薄弱项小结（每科 2-3 句）；2. 针对性学习建议 3 条。保持简洁。');
  for (const g of Array.isArray(groups) ? groups : []) {
    const seg = [`【${g.subject || '未分类'}】共 ${g.total || 0} 题`];
    if (g.highFreq) seg.push(`高频 ${g.highFreq} 题`);
    if (g.errorTotal) seg.push(`累计错 ${g.errorTotal} 次`);
    const stems = (Array.isArray(g.sampleStems) ? g.sampleStems : [])
      .slice(0, 5)
      .map(s => `「${String(s).slice(0, 60)}」`); // 截断控制 prompt 长度
    if (stems.length) seg.push('代表题：' + stems.join('、'));
    parts.push(seg.join('，'));
  }
  return parts.join('\n');
}
