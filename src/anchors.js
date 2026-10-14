// Cor de apoio (extensão): a paleta passa por mais de uma cor. Cada cor ocupa um nível exato;
// entre elas, a claridade segue linhas retas entre as cores e nunca sobe, e o matiz e a intensidade se interpolam.
import { normalizeHex, hexToOklch } from './color.js';
import { suggestBrandLevel } from './separation.js';

const MIN_CHROMA = 0.004; // abaixo disso o matiz não tem significado (cinzas)

/**
 * Nível de uma cor de apoio quando a pessoa não informa um: o de claridade mais próxima, mas sempre do lado certo da
 * cor principal. Uma cor de apoio mais clara que a principal fica antes do `brandLevel`; uma mais escura, depois.
 * Sem espaço desse lado (a principal já está na ponta), vale o nível mais próximo e o motor avisa.
 */
export function supportLevel(mainHex, supportHex, preset, brandLevel = preset.palette.baseLevel) {
  const { levels } = preset.palette;
  const nearest = suggestBrandLevel(supportHex, preset);
  const mainL = hexToOklch(mainHex).L, supL = hexToOklch(supportHex).L;
  if (supL > mainL + 1e-9 && nearest >= brandLevel) return [...levels].reverse().find((l) => l < brandLevel) ?? nearest;
  if (supL < mainL - 1e-9 && nearest <= brandLevel) return levels.find((l) => l > brandLevel) ?? nearest;
  return nearest;
}

// Valida as âncoras extras. `level` é opcional: sem ele, vale o nível de claridade mais próxima (o mesmo do Auto).
export function parseAnchors(raw) {
  if (raw == null) return [];
  if (!Array.isArray(raw)) throw new Error('anchors deve ser uma lista de { hex, level? }.');
  return raw.map((a, i) => {
    if (!a || typeof a !== 'object') throw new Error(`anchors[${i}] deve ser { hex, level? }.`);
    return { hex: normalizeHex(a.hex, `anchors[${i}].hex`), level: a.level ?? null };
  });
}

/**
 * Junta a cor principal (no brandLevel) e as de apoio numa lista ordenada por nível.
 * Devolve null quando só sobra uma âncora (a escala é a de sempre). Problemas viram avisos e a âncora é ignorada:
 *   - 'same-level': dois níveis iguais (vale a primeira; só acontece com nível informado ou sem espaço do lado certo);
 *   - 'order': a claridade subiria com o nível (a cor de apoio não cabe nessa posição).
 */
export function resolveAnchors(baseHex, brandLevel, extras, preset, warnings = []) {
  if (!extras.length) return null;
  const { levels, lightest, darkest } = preset.palette;
  const main = { hex: baseHex, level: brandLevel, role: 'main', ...hexToOklch(baseHex) };
  const list = [main];

  for (const e of extras) {
    const level = e.level ?? supportLevel(baseHex, e.hex, preset, brandLevel);
    if (!levels.includes(level)) throw new Error(`anchors: o nível ${level} não existe (${levels.join(', ')}).`);
    const taken = list.find((a) => a.level === level);
    if (taken) {
      warnings.push({ type: 'anchors', reason: 'same-level', level, hex: e.hex, with: taken.hex });
      continue;
    }
    list.push({ hex: e.hex, level, role: 'support', ...hexToOklch(e.hex) });
  }
  list.sort((a, b) => a.level - b.level);

  // A claridade só pode descer (ou ficar igual) quando o nível sobe. Se uma cor de apoio quebra isso, ela sai.
  for (let i = 1; i < list.length;) {
    if (list[i].L <= list[i - 1].L + 1e-9) { i++; continue; }
    const out = list[i].role === 'support' ? i : i - 1;
    warnings.push({ type: 'anchors', reason: 'order', level: list[out].level, hex: list[out].hex });
    list.splice(out, 1);
    i = Math.max(1, i - 1);
  }
  return list.length > 1 ? { list, lightest, darkest, levels } : null;
}

// Linhas retas entre os pontos: cada trecho tem o mesmo passo de claridade por nível, então os tons entre duas cores
// ficam com a mesma diferença visual. A claridade não sobe porque os pontos já vêm em ordem decrescente.
function piecewiseLinear(xs, ys) {
  return (x) => {
    let i = 0;
    while (i < xs.length - 2 && x > xs[i + 1]) i++;
    const t = (x - xs[i]) / (xs[i + 1] - xs[i]);
    return ys[i] + (ys[i + 1] - ys[i]) * t;
  };
}

const lerpHue = (a, b, t) => {
  const diff = ((b - a + 540) % 360) - 180; // caminho mais curto
  return (a + diff * t + 360) % 360;
};

/** Curvas do conjunto de âncoras: claridade, e a cor (intensidade e matiz) de cada nível. */
export function buildCurves(anchors) {
  const { list, lightest, darkest, levels } = anchors;
  const first = levels[0], last = levels[levels.length - 1];
  const xs = list.map((a) => a.level), ys = list.map((a) => a.L);
  if (first < xs[0]) { xs.unshift(first); ys.unshift(Math.max(lightest, list[0].L)); }
  const tail = list[list.length - 1];
  if (last > xs[xs.length - 1]) { xs.push(last); ys.push(Math.min(darkest, tail.L)); }
  const lightness = piecewiseLinear(xs, ys);

  const colorAt = (level) => {
    if (level <= list[0].level) return { C: list[0].C, h: list[0].h };
    if (level >= tail.level) return { C: tail.C, h: tail.h };
    let i = 0;
    while (level > list[i + 1].level) i++;
    const a = list[i], b = list[i + 1];
    const t = (level - a.level) / (b.level - a.level);
    // Um cinza (sem matiz de verdade) adota o matiz da outra cor.
    const ha = a.C < MIN_CHROMA ? b.h : a.h, hb = b.C < MIN_CHROMA ? a.h : b.h;
    return { C: a.C + (b.C - a.C) * t, h: lerpHue(ha, hb, t) };
  };
  return { lightness, colorAt };
}
