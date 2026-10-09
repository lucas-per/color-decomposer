// Relatório de contraste de um resultado: cada par superfície/texto com a razão e o nível WCAG.
import { contrastRatio } from './color.js';

export function auditResult(result) {
  const rows = [];
  for (const mode of ['light', 'dark']) {
    for (const g of ['palette', 'neutrals']) {
      const { surface, txtOn } = result[mode][g];
      for (const level of Object.keys(surface)) {
        const ratio = contrastRatio(surface[level], txtOn[level]);
        rows.push({ mode, group: g, level: Number(level), surface: surface[level], txtOn: txtOn[level], ratio, aa: ratio >= 4.5, aaa: ratio >= 7 });
      }
    }
  }
  return rows;
}
