import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  isDark,
  getStoredTheme,
  resolveTheme,
  applyTheme,
  initTheme,
  toggleTheme,
} from '../src/utils/theme'

// 夜间模式工具：html.dark 类驱动 + qb_theme 持久化；未选择时跟随系统
beforeEach(() => {
  document.documentElement.classList.remove('dark')
  localStorage.removeItem('qb_theme')
})

describe('theme 存取', () => {
  it('未选择过返回 null；显式选择返回对应值；非法值按未选择处理', () => {
    expect(getStoredTheme()).toBeNull()
    localStorage.setItem('qb_theme', 'dark')
    expect(getStoredTheme()).toBe('dark')
    localStorage.setItem('qb_theme', 'blue')
    expect(getStoredTheme()).toBeNull()
  })

  it('resolveTheme：显式选择优先，否则跟随系统', () => {
    localStorage.setItem('qb_theme', 'light')
    expect(resolveTheme()).toBe('light') // 即使系统是 dark 也尊重显式选择
    localStorage.removeItem('qb_theme')
    const mq = { matches: true, addEventListener: vi.fn() }
    vi.spyOn(window, 'matchMedia').mockReturnValue(mq)
    expect(resolveTheme()).toBe('dark')
    mq.matches = false
    expect(resolveTheme()).toBe('light')
  })
})

describe('applyTheme / initTheme / toggleTheme', () => {
  it('applyTheme 挂/摘 html.dark，isDark 同步', () => {
    applyTheme('dark')
    expect(isDark()).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    applyTheme('light')
    expect(isDark()).toBe(false)
  })

  it('initTheme 按当前解析结果应用', () => {
    localStorage.setItem('qb_theme', 'dark')
    initTheme()
    expect(isDark()).toBe(true)
  })

  it('toggleTheme 翻转并持久化，往返恢复原状', () => {
    expect(toggleTheme()).toBe('dark')
    expect(localStorage.getItem('qb_theme')).toBe('dark')
    expect(isDark()).toBe(true)
    expect(toggleTheme()).toBe('light')
    expect(localStorage.getItem('qb_theme')).toBe('light')
    expect(isDark()).toBe(false)
  })
})
