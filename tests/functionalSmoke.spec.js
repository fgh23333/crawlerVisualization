import { describe, it, expect, beforeEach } from 'vitest'
import router from '../src/router'
import { initTheme, toggleTheme, isDark } from '../src/utils/theme'
import { initZoom, setZoom } from '../src/utils/uiPrefs'

describe('功能性集成冒烟检查 (Functional Smoke)', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    document.documentElement.style.removeProperty('--app-zoom')
    document.body.style.zoom = ''
  })

  it('核心路由表完整且均可解析，无重复或缺失目标', () => {
    const expectedPaths = [
      '/',
      '/newHome',
      '/newHome/favorites',
      '/newHome/stats',
      '/newHome/about',
      '/newHome/chat',
      '/newHome/feedback',
      '/ncre3',
      '/computer-question',
    ]

    for (const p of expectedPaths) {
      const resolved = router.resolve(p)
      expect(resolved.matched.length, `route ${p} should match`).toBeGreaterThan(0)
    }
  })

  it('夜间模式与字号档位联动初始化与持久化正常', () => {
    initTheme()
    expect(isDark()).toBe(false)
    expect(toggleTheme()).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    initZoom()
    setZoom(1.15)
    expect(localStorage.getItem('qb_zoom')).toBe('1.15')
  })
})
