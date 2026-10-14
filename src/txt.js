// Token `txt` (cor de texto geral, sem superfície própria), como o gerador de tema do Aplica faz:
// um único valor por escala, escolhido na própria escala e validado contra o fundo ambiente.
import { contrastRatio } from './color.js';
import { PURE_INK } from './options.js';

const prefersDarkText = (bg, ink = PURE_INK) => contrastRatio(bg, ink.dark) >= contrastRatio(bg, ink.light);

// Ordem de busca: a partir do nível de referência, na direção do texto preferido; depois o resto.
function searchOrder(levels, start, bg, ink) {
  const nums = levels.map(Number).filter(Number.isFinite);
  const dark = prefersDarkText(bg, ink);
  const primary = dark ? nums.filter((l) => l >= start).sort((a, b) => a - b) : nums.filter((l) => l <= start).sort((a, b) => b - a);
  const secondary = dark ? nums.filter((l) => l < start).sort((a, b) => b - a) : nums.filter((l) => l > start).sort((a, b) => a - b);
  return [...primary, ...secondary];
}

function closestLevel(levels, preferred) {
  return levels.map(Number).reduce((best, l) => (Math.abs(l - preferred) < Math.abs(best - preferred) ? l : best));
}

export function resolveTxt(surface, background, { requiredRatio, txtBaseColorLevel, ink = PURE_INK }) {
  const levels = Object.keys(surface);
  const start = closestLevel(levels, txtBaseColorLevel);
  for (const level of searchOrder(levels, start, background, ink)) {
    const candidate = surface[level];
    if (candidate && contrastRatio(background, candidate) >= requiredRatio) return candidate;
  }
  const preferred = prefersDarkText(background, ink) ? ink.dark : ink.light;
  if (ink === PURE_INK || contrastRatio(background, preferred) >= requiredRatio) return preferred;
  return prefersDarkText(background) ? PURE_INK.dark : PURE_INK.light;
}

// Aplica o `txt` normalizado a uma escala: todos os níveis recebem o mesmo valor.
export function txtScaleFor(surface, background, cfg) {
  const value = resolveTxt(surface, background, cfg);
  return Object.fromEntries(Object.keys(surface).map((l) => [l, value]));
}
