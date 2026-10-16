// A própria interface usa a paleta gerada: fundo, texto e bordas saem dos neutros da cor escolhida.
import { contrastRatio } from '../src/index.js';

// Primeiro neutro que chega ao contraste mínimo contra todos os fundos informados.
function firstLevelWith(scale, levels, bgs, min) {
  const list = Array.isArray(bgs) ? bgs : [bgs];
  for (const l of levels) if (list.every((bg) => contrastRatio(bg, scale[l]) >= min)) return scale[l];
  return scale[levels.at(-1)];
}

export function chromeTokens(theme, name, mode, preset) {
  const levels = preset.neutrals.levels;
  const n = theme.colors[name][mode].neutrals;
  const bg = n.surface[levels[0]];
  const panel = n.surface[levels[1]] ?? bg;
  // as pontas da escala de neutros são sempre as de maior contraste, em qualquer modo
  const fg = n.surface[levels.at(-1)];
  // Alternador ligado (Cor viva): fundo invertido que clareia 1 nível no hover e 2 no pressed (UaiUI: ui/inverse/*).
  // Cada fundo leva o texto do próprio par (txtOn), que o motor já garante com contraste.
  const at = (i) => levels[levels.length - i];
  return {
    bg,
    panel,
    fg,
    'on-fg': n.txtOn[at(1)],
    'fg-hover': n.surface[at(2)] ?? fg,
    'on-fg-hover': n.txtOn[at(2)] ?? n.txtOn[at(1)],
    'fg-pressed': n.surface[at(3)] ?? n.surface[at(2)] ?? fg,
    'on-fg-pressed': n.txtOn[at(3)] ?? n.txtOn[at(2)] ?? n.txtOn[at(1)],
    // texto secundário: o primeiro neutro que chega a 5 para 1 (passa no AA com folga) no fundo e no painel.
    // Em escalas com poucos neutros o painel é mais escuro, então o painel também conta.
    muted: firstLevelWith(n.surface, levels, [bg, panel], 5),
    // contornos de campos precisam de 3 para 1 contra o fundo (WCAG 1.4.11)
    edge: firstLevelWith(n.surface, levels, bg, 3.2),
    // divisores decorativos
    line: n.border[levels[0]],
    ring: fg,
    // faixa do cabeçalho: a cor da marca digitada, sem alteração
    band: theme.colors[name].base
  };
}

export function applyChrome(tokens, mode) {
  const root = document.documentElement;
  root.dataset.theme = mode;
  root.style.colorScheme = mode;
  for (const [k, v] of Object.entries(tokens)) root.style.setProperty(`--${k}`, v);
}
