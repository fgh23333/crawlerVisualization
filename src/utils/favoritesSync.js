import LZString from 'lz-string'

/**
 * 将收藏夹数据编码为压缩文本码，可复制粘贴跨设备传输
 * @param {Array} likeList - 收藏的题目数组
 * @returns {string} Base64 压缩码
 */
export function encodeFavorites(likeList) {
  const payload = {
    v: 1,
    app: 'political_exam',
    ts: Date.now(),
    count: likeList.length,
    data: likeList
  }
  const json = JSON.stringify(payload)
  return LZString.compressToBase64(json)
}

/**
 * 解码压缩文本码，还原收藏夹数据
 * @param {string} codeString - 压缩文本码
 * @returns {{ count: number, data: Array }}
 */
export function decodeFavorites(codeString) {
  const json = LZString.decompressFromBase64(codeString)
  if (!json) {
    throw new Error('无法解析，请检查代码是否完整')
  }
  const parsed = JSON.parse(json)

  // 有 envelope 结构
  if (parsed && parsed.v !== undefined && Array.isArray(parsed.data)) {
    return { count: parsed.count || parsed.data.length, data: parsed.data }
  }

  // 兼容裸数组格式
  if (Array.isArray(parsed)) {
    return { count: parsed.length, data: parsed }
  }

  throw new Error('数据格式不正确')
}

/**
 * 将收藏夹数据导出为 JSON Blob 文件
 * @param {Array} likeList
 * @returns {{ blob: Blob, filename: string }}
 */
export function favoritesToJsonFile(likeList) {
  const payload = {
    v: 1,
    app: 'political_exam',
    ts: Date.now(),
    count: likeList.length,
    data: likeList
  }
  const json = JSON.stringify(payload, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const date = new Date().toISOString().slice(0, 10)
  const filename = `favorites_${date}.json`
  return { blob, filename }
}

/**
 * 解析上传的 JSON 文件或文本，还原收藏夹数据
 * @param {File|string} fileOrText
 * @returns {Promise<{ count: number, data: Array }>}
 */
export async function parseFavoritesFile(fileOrText) {
  let text
  if (typeof fileOrText === 'string') {
    text = fileOrText
  } else {
    text = await fileOrText.text()
  }
  const parsed = JSON.parse(text)

  if (parsed && parsed.v !== undefined && Array.isArray(parsed.data)) {
    return { count: parsed.count || parsed.data.length, data: parsed.data }
  }
  if (Array.isArray(parsed)) {
    return { count: parsed.length, data: parsed }
  }

  throw new Error('JSON 文件格式不正确')
}

/**
 * 合并收藏夹：取并集，按 id 去重
 * @param {Array} existingList - 当前本地收藏
 * @param {Array} incomingData - 导入的收藏
 * @returns {{ merged: Array, added: number, duplicates: number }}
 */
export function mergeFavorites(existingList, incomingData) {
  const existingIds = new Set(existingList.map(q => q.id))
  const fresh = incomingData.filter(q => !existingIds.has(q.id))
  return {
    merged: [...existingList, ...fresh],
    added: fresh.length,
    duplicates: incomingData.length - fresh.length
  }
}

/**
 * 编码全量用户数据（收藏、错题、标记、学习记录、查看状态）
 * @param {Object} payload - { wrongQuestions, likeList, markList, userRecords, viewedStates }
 * @returns {string} Base64 压缩码
 */
export function encodeAllData(payload) {
  const envelope = {
    v: 2,
    app: 'political_exam',
    ts: Date.now(),
    data: payload
  }
  const json = JSON.stringify(envelope)
  return LZString.compressToBase64(json)
}

/**
 * 解码全量用户数据
 * @param {string} codeString
 * @returns {{ ts: number, data: Object }}
 */
export function decodeAllData(codeString) {
  const json = LZString.decompressFromBase64(codeString)
  if (!json) {
    throw new Error('无法解析，请检查代码是否完整')
  }
  const parsed = JSON.parse(json)
  if (parsed && parsed.v === 2 && parsed.data) {
    return { ts: parsed.ts, data: parsed.data }
  }
  throw new Error('数据格式不正确')
}

/**
 * 收集所有 viewed_* 的 localStorage 键值
 * @returns {Object}
 */
export function collectViewedStates() {
  const states = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('viewed_')) {
      try {
        states[key] = JSON.parse(localStorage.getItem(key))
      } catch (e) {
        states[key] = localStorage.getItem(key)
      }
    }
  }
  return states
}

/**
 * 还原 viewed_* 状态到 localStorage
 * @param {Object} states
 */
export function restoreViewedStates(states) {
  for (const [key, value] of Object.entries(states || {})) {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
  }
}

/**
 * 合并全量数据
 * @param {Object} existing - 当前数据
 * @param {Object} incoming - 导入的数据
 * @returns {{ merged: Object, summary: Object }}
 */
export function mergeAllData(existing, incoming) {
  const merged = {
    wrongQuestions: mergeFavorites(existing.wrongQuestions || [], incoming.wrongQuestions || []).merged,
    likeList: mergeFavorites(existing.likeList || [], incoming.likeList || []).merged,
    markList: mergeFavorites(existing.markList || [], incoming.markList || []).merged,
    userRecords: { ...(existing.userRecords || {}) },
    viewedStates: { ...(existing.viewedStates || {}) }
  }

  // 合并 userRecords：保留更大的 attempted 和 errorCount
  for (const [qid, rec] of Object.entries(incoming.userRecords || {})) {
    const existingRec = merged.userRecords[qid]
    if (!existingRec) {
      merged.userRecords[qid] = rec
    } else {
      merged.userRecords[qid] = {
        questionId: qid,
        attempted: Math.max(existingRec.attempted || 0, rec.attempted || 0),
        errorCount: Math.max(existingRec.errorCount || 0, rec.errorCount || 0),
        lastErrorDate: (existingRec.lastErrorDate && existingRec.lastErrorDate > rec.lastErrorDate)
          ? existingRec.lastErrorDate : rec.lastErrorDate
      }
    }
  }

  // 合并 viewedStates：简单覆盖即可
  Object.assign(merged.viewedStates, incoming.viewedStates || {})

  const summary = {
    wrongAdded: merged.wrongQuestions.length - (existing.wrongQuestions || []).length,
    likeAdded: merged.likeList.length - (existing.likeList || []).length,
    markAdded: merged.markList.length - (existing.markList || []).length,
    recordsMerged: Object.keys(incoming.userRecords || {}).length,
    statesMerged: Object.keys(incoming.viewedStates || {}).length
  }

  return { merged, summary }
}
