/**
 * 显示偏好 —— 字号档位（问卷 #180：平板/小屏「字太小，按钮也太小」）。
 *
 * 方案：body 级 CSS zoom 等比缩放。站点样式为 px 体系，逐个改 rem 不现实；
 * zoom 挂在 body 上时 Element Plus teleport 到 body 的弹层（下拉/弹窗/消息）
 * 一并被缩放，视觉一致。档位持久化在 qb_zoom，未设置 = 标准 1。
 */
export const ZOOM_KEY = 'qb_zoom'

export const ZOOM_GEARS = [
  { label: '小', value: 0.9 },
  { label: '标准', value: 1 },
  { label: '大', value: 1.15 },
  { label: '特大', value: 1.3 }
]

const VALID = new Set(ZOOM_GEARS.map(g => String(g.value)))

/** 读取持久化档位；未设置/非法值返回 null（视为标准） */
export function getStoredZoom() {
  try {
    const v = localStorage.getItem(ZOOM_KEY)
    return VALID.has(v) ? Number(v) : null
  } catch (e) {
    return null
  }
}

/** 只应用不落盘；非档位值一律按 1 处理，1 时清掉内联样式还给 CSS */
export function applyZoom(value) {
  const v = VALID.has(String(value)) ? Number(value) : 1
  if (typeof document !== 'undefined' && document.body) {
    document.body.style.zoom = v === 1 ? '' : String(v)
  }
  return v
}

/** 应用 + 持久化（设置入口用） */
export function setZoom(value) {
  const v = applyZoom(value)
  try {
    localStorage.setItem(ZOOM_KEY, String(v))
  } catch (e) { /* 隐私模式等存不进时静默，仅本次生效 */ }
  return v
}

/** 启动初始化：有存档用存档，否则标准 */
export function initZoom() {
  return applyZoom(getStoredZoom() ?? 1)
}
