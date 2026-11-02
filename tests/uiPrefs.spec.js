import { describe, it, expect, beforeEach } from 'vitest'
import {
  ZOOM_KEY,
  ZOOM_GEARS,
  getStoredZoom,
  applyZoom,
  setZoom,
  initZoom,
} from '../src/utils/uiPrefs'

// 字号档位：body 级 CSS zoom + qb_zoom 持久化；未设置 = 标准 1
beforeEach(() => {
  localStorage.clear()
  document.body.style.zoom = ''
})

describe('ZOOM_GEARS 档位', () => {
  it('四档：小/标准/大/特大', () => {
    expect(ZOOM_GEARS.map(g => g.label)).toEqual(['小', '标准', '大', '特大'])
    expect(ZOOM_GEARS.map(g => g.value)).toEqual([0.9, 1, 1.15, 1.3])
  })
})

describe('getStoredZoom 读取', () => {
  it('未设置/非法值返回 null；合法档位返回数值', () => {
    expect(getStoredZoom()).toBeNull()
    localStorage.setItem(ZOOM_KEY, '1.15')
    expect(getStoredZoom()).toBe(1.15)
    localStorage.setItem(ZOOM_KEY, '0.7') // 非档位值
    expect(getStoredZoom()).toBeNull()
  })
})

describe('applyZoom / setZoom / initZoom', () => {
  it('applyZoom 应用到 body；标准档清掉内联样式', () => {
    expect(applyZoom(1.3)).toBe(1.3)
    expect(document.body.style.zoom).toBe('1.3')
    expect(applyZoom(1)).toBe(1)
    expect(document.body.style.zoom).toBe('')
  })

  it('同步挂 --app-zoom 变量供 calc(100dvh / var) 抵消 zoom', () => {
    applyZoom(1.3)
    expect(document.documentElement.style.getPropertyValue('--app-zoom')).toBe('1.3')
    applyZoom(0.9)
    expect(document.documentElement.style.getPropertyValue('--app-zoom')).toBe('0.9')
    applyZoom(1)
    expect(document.documentElement.style.getPropertyValue('--app-zoom')).toBe('1')
  })

  it('非档位值一律按标准处理', () => {
    expect(applyZoom(2)).toBe(1)
    expect(applyZoom(undefined)).toBe(1)
  })

  it('setZoom 应用 + 持久化；initZoom 无存档时回到标准', () => {
    expect(setZoom(0.9)).toBe(0.9)
    expect(localStorage.getItem(ZOOM_KEY)).toBe('0.9')
    expect(document.body.style.zoom).toBe('0.9')
    localStorage.removeItem(ZOOM_KEY)
    document.body.style.zoom = '1.3' // 脏状态
    expect(initZoom()).toBe(1)
    expect(document.body.style.zoom).toBe('')
    localStorage.setItem(ZOOM_KEY, '1.15')
    expect(initZoom()).toBe(1.15)
    expect(document.body.style.zoom).toBe('1.15')
  })
})
