// Cor de apoio (extensão): a paleta passa por mais de uma cor. Cada cor ocupa um nível exato;
// entre elas, a claridade segue uma curva suave que nunca sobe, e o matiz e a intensidade se interpolam.
import { normalizeHex, hexToOklch } from './color.js';
import { suggestBrandLevel } from './separation.js';

const MIN_CHROMA = 0.004; // abaixo disso o matiz não tem significado (cinzas)

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
 *   - 'same-level': dois níveis iguais (vale a primeira);
 *   - 'order': a claridade subiria com o nível (a cor de apoio não cabe nessa posição).
 */
export function resolveAnchors(baseHex, brandLevel, extras, preset, warnings = []) {
  if (!extras.length) return null;
  const { levels, lightest, darkest } = preset.palette;
  const main = { hex: baseHex, level: brandLevel, role: 'main', ...hexToOklch(baseHex) };
  const list = [main];

  for (const e of extras) {
    const level = e.level ?? suggestBrandLevel(e.hex, preset);
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

// Interpolação monotônica (Fritsch-Carlson): passa pelos pontos e não cria subidas entre eles.
function monotoneCurve(xs, ys) {
  const n = xs.length;
  const h = [], d = [];
  for (let i = 0; i < n - 1; i++) { h.push(xs[i + 1] - xs[i]); d.push((ys[i + 1] - ys[i]) / h[i]); }
  const m = new Array(n);
  if (n === 2) { m[0] = m[1] = d[0]; }
  else {
    for (let i = 1; i < n - 1; i++) {
      if (d[i - 1] * d[i] <= 0) { m[i] = 0; continue; }
      const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1];
      m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
    }
    const end = (h0, h1, d0, d1) => {
      let s = ((2 * h0 + h1) * d0 - h0 * d1) / (h0 + h1);
      if (Math.sign(s) !== Math.sign(d0)) s = 0;
      else if (Math.sign(d0) !== Math.sign(d1) && Math.abs(s) > 3 * Math.abs(d0)) s = 3 * d0;
      return s;
    };
    m[0] = end(h[0], h[1], d[0], d[1]);
    m[n - 1] = end(h[n - 2], h[n - 3], d[n - 2], d[n - 3]);
  }
  return (x) => {
    let i = 0;
    while (i < n - 2 && x > xs[i + 1]) i++;
    const t = (x - xs[i]) / h[i];
    const t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h[i] * m[i]
      + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h[i] * m[i + 1];
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
  const lightness = monotoneCurve(xs, ys);

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
