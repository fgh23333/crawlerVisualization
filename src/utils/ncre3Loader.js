const ncre3Modules = import.meta.glob('/src/assets/ncre3/*.json')

export async function loadNcre3Data(fileName) {
  const key = `/src/assets/ncre3/${fileName}.json`
  const loader = ncre3Modules[key]
  if (!loader) throw new Error(`NCRE3 data not found: ${key}`)
  const mod = await loader()
  return mod.default || mod
}

export async function loadAllNcre3Data() {
  const results = {}
  for (const [key, loader] of Object.entries(ncre3Modules)) {
    const fileName = key.split('/').pop().replace('.json', '')
    const mod = await loader()
    results[fileName] = mod.default || mod
  }
  return results
}
