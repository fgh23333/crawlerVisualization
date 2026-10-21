import { describe, it, expect } from 'vitest'

// AI 输出统一渲染入口：LaTeX 片段归一化（题干里常见的 $\rightarrow$ 等）+ marked 解析
import { normalizeLatexMath, renderMarkdown } from '../src/utils/renderMarkdown'

describe('normalizeLatexMath LaTeX 片段归一化', () => {
  it('$\\rightarrow$ 转为 Unicode 箭头并剥掉定界符', () => {
    expect(normalizeLatexMath('$\\rightarrow$')).toBe('→')
    expect(normalizeLatexMath('生产力 $\\rightarrow$ 生产关系')).toBe('生产力 → 生产关系')
  })

  it('$p \\rightarrow q$ 混排片段：命令转符号、字母保留', () => {
    expect(normalizeLatexMath('$p \\rightarrow q$')).toBe('p → q')
  })

  it('常用箭头/关系符/Greek 字母均在映射表内', () => {
    expect(normalizeLatexMath('$\\times$')).toBe('×')
    expect(normalizeLatexMath('$\\leq$')).toBe('≤')
    expect(normalizeLatexMath('$\\Alpha$')).toBe('Α')
    expect(normalizeLatexMath('$\\alpha$')).toBe('α')
    expect(normalizeLatexMath('$\\infty$')).toBe('∞')
  })

  it('裸命令（未加 $）同样转符号；行内定界符 \\( \\) 剥除', () => {
    expect(normalizeLatexMath('A \\rightarrow B')).toBe('A → B')
    expect(normalizeLatexMath('\\(x \\to y\\)')).toBe('x → y')
  })

  it('未知命令原样保留，不误伤普通文本与价格 $', () => {
    expect(normalizeLatexMath('未知 \\foo 保留')).toBe('未知 \\foo 保留')
    expect(normalizeLatexMath('价格 $5 与 $6 不动')).toBe('价格 $5 与 $6 不动')
    expect(normalizeLatexMath('普通文本')).toBe('普通文本')
    expect(normalizeLatexMath('')).toBe('')
  })
})

describe('renderMarkdown 渲染入口', () => {
  it('Markdown 语法正常解析', () => {
    expect(renderMarkdown('**重点**')).toContain('<strong>重点</strong>')
  })

  it('渲染前完成 LaTeX 归一化：输出不再含 $\\rightarrow$', () => {
    const html = renderMarkdown('矛盾双方在一定条件下 $\\rightarrow$ 相互转化')
    expect(html).toContain('→')
    expect(html).not.toContain('\\rightarrow')
    expect(html).not.toContain('$')
  })
})
