const ncre3Modules = import.meta.glob('/src/assets/ncre3/*.json')

// 判断题源数据以 A/B 字母记录正确项，而练习/考试的作答值均为选项文本（正确/错误），加载时统一归一
function normalizeQuestion(q) {
  if (q && q.type === 'trueOrFalse' && Array.isArray(q.option) && q.option.length === 2) {
    const idx = ['A', 'B'].indexOf(String(q.answer).trim().toUpperCase())
    if (idx >= 0) return { ...q, answer: q.option[idx] }
  }
  return q
}

function normalizeData(data) {
  return Array.isArray(data) ? data.map(normalizeQuestion) : data
}

export async function loadNcre3Data(fileName) {
  const key = `/src/assets/ncre3/${fileName}.json`
  const loader = ncre3Modules[key]
  if (!loader) throw new Error(`NCRE3 data not found: ${key}`)
  const mod = await loader()
  return normalizeData(mod.default || mod)
}

export async function loadAllNcre3Data() {
  const results = {}
  for (const [key, loader] of Object.entries(ncre3Modules)) {
    const fileName = key.split('/').pop().replace('.json', '')
    const mod = await loader()
    results[fileName] = normalizeData(mod.default || mod)
  }
  return results
}
