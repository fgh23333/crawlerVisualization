/**
 * AI 输出的统一 Markdown 渲染入口
 *
 * 题库题干与模型输出里混有 LaTeX 数学片段（如 "$\rightarrow$"），
 * marked 不解析 LaTeX，直接 v-html 会把原样符号漏给用户。
 * 这里在 parse 前做一层轻量归一化：把常见 LaTeX 命令转成 Unicode
 * 符号并剥掉 $ 定界符，零依赖（不引 KaTeX，与端侧离线场景兼容）。
 */

import { marked } from 'marked';

// 常见 LaTeX 命令 → Unicode 映射（思政题库里以箭头/关系符/Greek 字母为主）
const LATEX_SYMBOLS = {
  rightarrow: '→', to: '→', leftarrow: '←', Rightarrow: '⇒', Leftarrow: '⇐',
  leftrightarrow: '↔', Leftrightarrow: '⇔', mapsto: '↦', longrightarrow: '⟶',
  times: '×', div: '÷', cdot: '·', pm: '±', mp: '∓', ast: '∗',
  leq: '≤', le: '≤', geq: '≥', ge: '≥', neq: '≠', ne: '≠', equiv: '≡', approx: '≈', sim: '∼', propto: '∝',
  in: '∈', notin: '∉', subset: '⊂', supset: '⊃', subseteq: '⊆', cup: '∪', cap: '∩', emptyset: '∅',
  infty: '∞', partial: '∂', nabla: '∇', forall: '∀', exists: '∃',
  ldots: '…', dots: '…', cdots: '⋯', vdots: '⋮',
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε', zeta: 'ζ', eta: 'η',
  theta: 'θ', iota: 'ι', kappa: 'κ', lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π', rho: 'ρ',
  sigma: 'σ', tau: 'τ', upsilon: 'υ', phi: 'φ', varphi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω',
  Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π', Sigma: 'Σ', Phi: 'Φ',
  Psi: 'Ψ', Omega: 'Ω', Alpha: 'Α', Beta: 'Β', Epsilon: 'Ε', Zeta: 'Ζ', Eta: 'Η', Iota: 'Ι',
  Kappa: 'Κ', Mu: 'Μ', Nu: 'Ν', Omicron: 'Ο', Rho: 'Ρ', Tau: 'Τ', Upsilon: 'Υ', Chi: 'Χ',
};

/**
 * 归一化文本中的 LaTeX 片段（renderMarkdown 的预处理，纯函数可单测）
 * - "$...\..."：内部含反斜杠命令才视为 LaTeX 片段剥掉 $（价格等普通 $ 不动）
 * - 裸 "\command"：仅映射表内的命令转 Unicode，未知命令原样保留
 * - 行内定界符 \( \) \[ \]：直接剥除
 * @param {string} text
 * @returns {string}
 */
export function normalizeLatexMath(text) {
  let s = String(text ?? '');
  if (!s.includes('\\') && !s.includes('$')) return s; // 快速路径：绝大多数内容不含数学片段
  const conv = (str) => str.replace(/\\([A-Za-z]+)/g, (m, name) =>
    (Object.prototype.hasOwnProperty.call(LATEX_SYMBOLS, name) ? LATEX_SYMBOLS[name] : m));
  // $...$ 定界：仅内部含反斜杠命令的按 LaTeX 片段处理
  s = s.replace(/\$([^$]{1,120})\$/g, (m, inner) => (inner.includes('\\') ? conv(inner) : m));
  // 裸命令 + 行内定界符
  s = conv(s);
  s = s.replace(/\\[()[\]]/g, '');
  return s;
}

/**
 * 统一渲染入口：LaTeX 归一化 + marked 解析（AI 聊天与题目剖析共用）
 * @param {string} text
 * @returns {string} HTML
 */
export function renderMarkdown(text) {
  return marked.parse(normalizeLatexMath(text));
}
