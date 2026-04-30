/**
 * Vite-compatible dynamic JSON loading utilities.
 * Uses import.meta.glob() to allow dynamic path construction.
 */

const questionModules = import.meta.glob('/src/assets/*_*.json')
const examModules = import.meta.glob('/src/assets/cura/*.json')

export async function loadQuestionBank(lesson, type) {
  const key = `/src/assets/${lesson}_${type}.json`
  const loader = questionModules[key]
  if (!loader) throw new Error(`Question bank not found: ${key}`)
  const mod = await loader()
  return mod.default || mod
}

export async function loadExamPaper(lesson, id) {
  const key = `/src/assets/cura/${lesson}_${id}.json`
  const loader = examModules[key]
  if (!loader) throw new Error(`Exam paper not found: ${key}`)
  const mod = await loader()
  return mod.default || mod
}
