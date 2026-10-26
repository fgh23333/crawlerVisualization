/**
 * 考试作答进度快照：防意外退出（关页 / 崩溃 / 误触返回）丢失未提交作答。
 * localStorage 单槽位（exam_snapshot），只保留最近一次未提交的考试；
 * 提交判分后由 store.checkAnswer 主动清空，7 天未动自动过期。
 * 快照自带整卷题目，恢复时不依赖题库重新拉取，随机卷也能原样复原。
 */
const SNAPSHOT_KEY = 'exam_snapshot'
const SNAPSHOT_VERSION = 1
const SNAPSHOT_TTL_MS = 7 * 864e5

/**
 * 已答计数：非空字符串（单选/判断/填空）或非空数组（多选）
 */
export function countAnswered(answerList) {
    if (!Array.isArray(answerList)) return 0
    return answerList.filter(answer =>
        Array.isArray(answer) ? answer.length > 0
            : (typeof answer === 'string' && answer.trim() !== '')
    ).length
}

/**
 * 槽位匹配：kind（sizheng / ncre3）+ lesson + paperId 三元组全等才算同一张卷。
 * paperId 统一存字符串（'random' / '3' / 'theory'），避免路由参数类型漂移。
 */
export function matchesSnapshot(snapshot, { kind, lesson, paperId }) {
    return !!(snapshot
        && snapshot.kind === kind
        && snapshot.lesson === lesson
        && snapshot.paperId === String(paperId))
}

/**
 * 纯函数校验：结构完整、作答表与题目一一对应、未过 7 天有效期。
 * now 可注入便于测试；任何不合法返回 null。
 */
export function validateSnapshot(raw, now = Date.now()) {
    if (!raw || typeof raw !== 'object') return null
    if (raw.v !== SNAPSHOT_VERSION) return null
    if (typeof raw.kind !== 'string' || typeof raw.lesson !== 'string' || typeof raw.paperId !== 'string') return null
    if (!Array.isArray(raw.questions) || raw.questions.length === 0) return null
    if (!raw.questions.every(q => q && typeof q === 'object' && q.id !== undefined && typeof q.questionStem === 'string')) return null
    if (!Array.isArray(raw.answerList) || raw.answerList.length !== raw.questions.length) return null
    if (raw.answerTouches !== undefined
        && (typeof raw.answerTouches !== 'object' || raw.answerTouches === null || Array.isArray(raw.answerTouches))) return null
    if (typeof raw.elapsed !== 'number' || !Number.isFinite(raw.elapsed) || raw.elapsed < 0) return null
    if (typeof raw.savedAt !== 'number' || !Number.isFinite(raw.savedAt)) return null
    // 过期或时钟明显超前（>1 天）视为无效
    if (now - raw.savedAt > SNAPSHOT_TTL_MS || raw.savedAt > now + 864e5) return null
    return { ...raw, answerTouches: raw.answerTouches || {} }
}

export function saveExamSnapshot(payload) {
    const snapshot = { v: SNAPSHOT_VERSION, ...payload, savedAt: Date.now() }
    try {
        localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot))
    } catch (e) {
        // 配额满等写入失败：放弃快照并清槽位，绝不能让保存动作打断答题
        console.warn('examSnapshot save failed:', e)
        clearExamSnapshot()
    }
}

export function loadExamSnapshot() {
    let text = null
    try {
        text = localStorage.getItem(SNAPSHOT_KEY)
    } catch (e) {
        return null
    }
    if (!text) return null
    let raw = null
    try {
        raw = JSON.parse(text)
    } catch (e) {
        raw = null
    }
    const snapshot = validateSnapshot(raw)
    if (!snapshot) {
        // 损坏 / 过期 / 版本不符 → 清槽位，对外视为无快照
        clearExamSnapshot()
        return null
    }
    return snapshot
}

export function clearExamSnapshot() {
    try {
        localStorage.removeItem(SNAPSHOT_KEY)
    } catch (e) {
        // localStorage 不可用时忽略，快照本就是尽力而为的兜底
    }
}
