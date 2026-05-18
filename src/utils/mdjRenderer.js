/**
 * 将 StarUML .mdj JSON 转换为 mermaid 语法
 * 支持: classDiagram, stateDiagram-v2, erDiagram, flowchart
 */
import mermaid from 'mermaid'

mermaid.initialize({
  startOnLoad: false,
  suppressErrors: true,
  theme: 'base',
  themeVariables: {
    primaryColor: '#E6E4F4',
    primaryTextColor: '#333',
    primaryBorderColor: '#6C5DD3',
    lineColor: '#6C5DD3',
    fontSize: '13px'
  }
})

/**
 * 解析 .mdj JSON，返回 mermaid 语法定义字符串
 */
export function mdjToMermaid(mdjJson) {
  // 1. Build id→element lookup
  const byId = {}
  function indexElements(obj) {
    if (!obj || typeof obj !== 'object') return
    if (obj._id) byId[obj._id] = obj
    for (const k of Object.keys(obj)) {
      if (Array.isArray(obj[k])) obj[k].forEach(indexElements)
      else if (typeof obj[k] === 'object' && obj[k] !== null && !k.startsWith('$')) indexElements(obj[k])
    }
  }
  indexElements(mdjJson)

  // 2. Detect diagram type
  let diagramType = null
  let hasStates = false
  let hasER = false
  let hasClass = false
  let hasComponent = false
  let hasFlowchart = false
  let hasUseCase = false

  function detectTypes(obj) {
    if (!obj || typeof obj !== 'object') return
    if (obj._type === 'UMLState') hasStates = true
    if (obj._type === 'UMLPseudostate' && obj.kind === 'initial') hasStates = true
    if (obj._type === 'ERDEntity') hasER = true
    if (obj._type === 'UMLClass' && obj._parent?.$ref) hasClass = true
    if (obj._type === 'UMLComponent') hasComponent = true
    if (obj._type === 'UMLUseCase') hasUseCase = true
    if (obj._type === 'FCFlowchartDiagram' || obj._type === 'FCFlowchart') hasFlowchart = true
    for (const k of Object.keys(obj)) {
      if (Array.isArray(obj[k])) obj[k].forEach(detectTypes)
      else if (typeof obj[k] === 'object' && obj[k] !== null && !k.startsWith('$')) detectTypes(obj[k])
    }
  }
  detectTypes(mdjJson)

  // 3. Generate mermaid based on type
  if (hasStates) return renderStateDiagram(mdjJson, byId)
  if (hasER) return renderERDiagram(mdjJson, byId)
  if (hasUseCase) return renderUseCaseDiagram(mdjJson, byId)
  if (hasClass) return renderClassDiagram(mdjJson, byId)
  if (hasComponent) return renderComponentDiagram(mdjJson, byId)
  return null
}

function ref(obj) {
  if (!obj) return null
  if (typeof obj === 'string') return obj
  return obj.$ref || null
}

function safeName(name) {
  let safe = (name || 'Unnamed').replace(/[[\]{}()<>]/g, '_').replace(/\s+/g, '_')
  // Mermaid identifiers must start with a letter
  if (/^[^a-zA-Z]/.test(safe)) safe = 'N' + safe
  return safe.replace(/[^a-zA-Z0-9_]/g, '')
}

/** 类图 */
function renderClassDiagram(mdj, byId) {
  const lines = ['classDiagram']

  // Find all classes and interfaces
  for (const [, el] of Object.entries(byId)) {
    if (el._type === 'UMLClass' || el._type === 'UMLInterface') {
      const name = safeName(el.name)
      const keyword = el._type === 'UMLInterface' ? 'interface ' : ''
      lines.push(`    ${keyword}${name} {`)

      // Attributes
      if (el.ownedElements) {
        for (const child of el.ownedElements) {
          const childEl = byId[ref(child)] || child
          if (childEl._type === 'UMLAttribute' && childEl.name) {
            const vis = childEl.visibility === 'private' ? '-' : childEl.visibility === 'protected' ? '#' : '+'
            lines.push(`        ${vis}${childEl.name}`)
          }
        }
      }

      // Operations
      if (el.ownedElements) {
        for (const child of el.ownedElements) {
          const childEl = byId[ref(child)] || child
          if (childEl._type === 'UMLOperation' && childEl.name) {
            const vis = childEl.visibility === 'private' ? '-' : childEl.visibility === 'protected' ? '#' : '+'
            lines.push(`        ${vis}${childEl.name}()`)
          }
        }
      }
      lines.push('    }')
    }
  }

  // Find relationships
  for (const [, el] of Object.entries(byId)) {
    if (el._type === 'UMLAssociation' && el.ownedElements) {
      const ends = el.ownedElements
        .map(e => byId[ref(e)] || e)
        .filter(e => e._type === 'UMLAssociationEnd')
      if (ends.length === 2) {
        const srcRef = byId[ref(ends[0].reference)]
        const tgtRef = byId[ref(ends[1].reference)]
        if (srcRef?.name && tgtRef?.name) {
          lines.push(`    ${safeName(srcRef.name)} --> ${safeName(tgtRef.name)}`)
        }
      }
    }
    if (el._type === 'UMLInterfaceRealization') {
      const src = byId[ref(el.source)]
      const tgt = byId[ref(el.target)]
      if (src?.name && tgt?.name) {
        lines.push(`    ${safeName(src.name)} ..|> ${safeName(tgt.name)} : implements`)
      }
    }
    if (el._type === 'UMLGeneralization') {
      const src = byId[ref(el.source)]
      const tgt = byId[ref(el.target)]
      if (src?.name && tgt?.name) {
        lines.push(`    ${safeName(src.name)} --|> ${safeName(tgt.name)} : extends`)
      }
    }
    if (el._type === 'UMLDependency') {
      const src = byId[ref(el.source)]
      const tgt = byId[ref(el.target)]
      if (src?.name && tgt?.name) {
        lines.push(`    ${safeName(src.name)} ..> ${safeName(tgt.name)} : uses`)
      }
    }
  }

  return lines.join('\n')
}

/** 状态机图 */
function renderStateDiagram(mdj, byId) {
  const lines = ['stateDiagram-v2']

  // Build state name map
  const stateNames = new Map()
  for (const [, el] of Object.entries(byId)) {
    if (el._type === 'UMLState' && el.name) {
      stateNames.set(el._id, safeName(el.name))
    }
  }

  // Transitions only - infer states from transitions
  for (const [, el] of Object.entries(byId)) {
    if (el._type === 'UMLTransition') {
      const srcId = ref(el.source)
      const tgtId = ref(el.target)
      const src = byId[srcId]
      const tgt = byId[tgtId]

      if (!src || !tgt) continue

      // Source
      let srcName
      if (src._type === 'UMLPseudostate' && src.kind === 'initial') {
        srcName = '[*]'
      } else if (src._type === 'UMLPseudostate') {
        // Choice/junction pseudostate - skip transitions from these
        continue
      } else if (src._type === 'UMLFinalState') {
        continue
      } else {
        srcName = stateNames.get(srcId) || safeName(src.name || 'State')
      }

      // Target
      let tgtName
      if (tgt._type === 'UMLFinalState') {
        tgtName = '[*]'
      } else if (tgt._type === 'UMLPseudostate') {
        continue
      } else {
        tgtName = stateNames.get(tgtId) || safeName(tgt.name || 'State')
      }

      // Find trigger event
      let label = ''
      if (el.ownedElements) {
        for (const child of el.ownedElements) {
          const childEl = byId[ref(child)] || child
          if (childEl._type === 'UMLEvent' && childEl.name) {
            label = ` : ${childEl.name}`
          }
        }
      }
      if (!label && el.trigger) {
        const triggerEl = byId[ref(el.trigger)]
        if (triggerEl?.name) label = ` : ${triggerEl.name}`
      }

      lines.push(`    ${srcName} --> ${tgtName}${label}`)
    }
  }

  return lines.join('\n')
}

/** ER图 */
function renderERDiagram(mdj, byId) {
  const lines = ['erDiagram']

  for (const [, el] of Object.entries(byId)) {
    if (el._type === 'ERDEntity' && el.name) {
      lines.push(`    ${safeName(el.name)} {`)
      if (el.ownedElements) {
        for (const child of el.ownedElements) {
          const childEl = byId[ref(child)] || child
          if (childEl._type === 'ERDColumn' && childEl.name) {
            const pk = childEl.primaryKey ? ' PK' : ''
            const fk = childEl.foreignKey ? ' FK' : ''
            lines.push(`        ${childEl.type || 'string'} ${safeName(childEl.name)}${pk}${fk}`)
          }
        }
      }
      lines.push('    }')
    }
    if (el._type === 'ERDRelationship') {
      const src = byId[ref(el.source)]
      const tgt = byId[ref(el.target)]
      if (src?.name && tgt?.name) {
        lines.push(`    ${safeName(src.name)} ||--o{ ${safeName(tgt.name)} : ""`)
      }
    }
  }

  return lines.join('\n')
}

/** 用例图 - 简化为 flowchart */
function renderUseCaseDiagram(mdj, byId) {
  const lines = ['flowchart LR']

  for (const [, el] of Object.entries(byId)) {
    if (el._type === 'UMLActor' && el.name) {
      lines.push(`    actor_${safeName(el.name)}[("👤 ${el.name}")]`)
    }
    if (el._type === 'UMLUseCase' && el.name) {
      lines.push(`    uc_${safeName(el.name)}(("${el.name}"))`)
    }
  }

  for (const [, el] of Object.entries(byId)) {
    if (el._type === 'UMLAssociation' && el.ownedElements) {
      const ends = el.ownedElements.map(e => byId[ref(e)] || e).filter(e => e._type === 'UMLAssociationEnd')
      if (ends.length === 2) {
        const src = byId[ref(ends[0].reference)]
        const tgt = byId[ref(ends[1].reference)]
        if (src?.name && tgt?.name) {
          const srcId = src._type === 'UMLActor' ? `actor_${safeName(src.name)}` : `uc_${safeName(src.name)}`
          const tgtId = tgt._type === 'UMLActor' ? `actor_${safeName(tgt.name)}` : `uc_${safeName(tgt.name)}`
          lines.push(`    ${srcId} --> ${tgtId}`)
        }
      }
    }
  }

  return lines.join('\n')
}

/** 组件图 - 简化为 flowchart */
function renderComponentDiagram(mdj, byId) {
  const lines = ['flowchart TD']

  for (const [, el] of Object.entries(byId)) {
    if (el._type === 'UMLComponent' && el.name) {
      lines.push(`    comp_${safeName(el.name)}["${el.name}"]`)
    }
    if (el._type === 'UMLInterface' && el.name) {
      lines.push(`    iface_${safeName(el.name)}(("${el.name}"))`)
    }
  }

  for (const [, el] of Object.entries(byId)) {
    if (el._type === 'UMLDependency') {
      const src = byId[ref(el.source)]
      const tgt = byId[ref(el.target)]
      if (src?.name && tgt?.name) {
        const srcId = src._type === 'UMLComponent' ? `comp_${safeName(src.name)}` : `iface_${safeName(src.name)}`
        const tgtId = tgt._type === 'UMLComponent' ? `comp_${safeName(tgt.name)}` : `iface_${safeName(tgt.name)}`
        lines.push(`    ${srcId} -.-> ${tgtId}`)
      }
    }
  }

  return lines.join('\n')
}

/**
 * 渲染 mermaid 到 DOM 元素
 */
export async function renderMermaid(mermaidDef, container) {
  if (!mermaidDef || !container) return
  const id = 'mermaid-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6)
  try {
    const { svg } = await mermaid.render(id, mermaidDef)
    container.innerHTML = svg
  } catch (e) {
    console.warn('Mermaid render failed:', e)
    // Clean up any error element mermaid left in the DOM
    const errorEl = document.getElementById('d' + id)
    if (errorEl) errorEl.remove()
    container.innerHTML = '<p style="color:#999;padding:20px;">图表渲染失败，请下载 .mdj 文件查看</p>'
  }
}
