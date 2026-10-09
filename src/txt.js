// Token `txt` (cor de texto geral, sem superfície própria), como o gerador de tema do Aplica faz:
// um único valor por escala, escolhido na própria escala e validado contra o fundo ambiente.
import { contrastRatio } from './color.js';

const prefersDarkText = (bg) => contrastRatio(bg, '#000000') >= contrastRatio(bg, '#ffffff');

// Ordem de busca: a partir do nível de referência, na direção do texto preferido; depois o resto.
function searchOrder(levels, start, bg) {
  const nums = levels.map(Number).filter(Number.isFinite);
  const dark = prefersDarkText(bg);
  const primary = dark ? nums.filter((l) => l >= start).sort((a, b) => a - b) : nums.filter((l) => l <= start).sort((a, b) => b - a);
  const secondary = dark ? nums.filter((l) => l < start).sort((a, b) => b - a) : nums.filter((l) => l > start).sort((a, b) => a - b);
  return [...primary, ...secondary];
}

function closestLevel(levels, preferred) {
  return levels.map(Number).reduce((best, l) => (Math.abs(l - preferred) < Math.abs(best - preferred) ? l : best));
}

export function resolveTxt(surface, background, { requiredRatio, txtBaseColorLevel }) {
  const levels = Object.keys(surface);
  const start = closestLevel(levels, txtBaseColorLevel);
  for (const level of searchOrder(levels, start, background)) {
    const candidate = surface[level];
    if (candidate && contrastRatio(background, candidate) >= requiredRatio) return candidate;
  }
  return prefersDarkText(background) ? '#000000' : '#ffffff';
}

// Aplica o `txt` normalizado a uma escala: todos os níveis recebem o mesmo valor.
export function txtScaleFor(surface, background, cfg) {
  const value = resolveTxt(surface, background, cfg);
  return Object.fromEntries(Object.keys(surface).map((l) => [l, value]));
}
