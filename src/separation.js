// Separação entre tons vizinhos: avisa quando dois tons seguidos da paleta quase não se distinguem.
// Mede a distância perceptual (ΔE em OKLab) entre vizinhos e a normaliza por 10 níveis, para que
// escalas com mais ou menos tons (19 no Aplica, 9 no personalizado) usem o mesmo limite.
import { deltaEOk, hexToOklab } from './color.js';

// Calibrado com cores conhecidas: amarelos, limões, ciano e cremes ficam abaixo (tons colados);
// âmbar, laranja, rosa, azul e verde ficam acima. Não é um padrão de mercado: é um limite prático.
export const SEPARATION_LIMIT = 0.012;

/**
 * @param {Record<string,string>} surface  nível → hex (a paleta de um modo)
 * @param {string} base                    cor da marca (hex)
 * @returns {{ limit:number, pairs:{from:number,to:number,delta:number}[], runs:{from:number,to:number,side:'lighter'|'darker'}[], tones:number[], total:number, min:number }}
 */
export function checkToneSeparation(surface, base, limit = SEPARATION_LIMIT) {
  const levels = Object.keys(surface).map(Number).sort((a, b) => a - b);
  const baseL = hexToOklab(base).L;
  const pairs = [];
  let min = Infinity;
  for (let i = 1; i < levels.length; i++) {
    const a = levels[i - 1], b = levels[i];
    const delta = (deltaEOk(surface[a], surface[b]) * 10) / (b - a);
    min = Math.min(min, delta);
    if (delta < limit) pairs.push({ from: a, to: b, delta });
  }
  // Trechos seguidos viram uma faixa só; um único par solto entre dois trechos não separa a faixa.
  const idx = (l) => levels.indexOf(l);
  const runs = [];
  for (const p of pairs) {
    const last = runs.at(-1);
    if (last && idx(p.from) - idx(last.to) <= 1) last.to = p.to;
    else runs.push({ from: p.from, to: p.to });
  }
  for (const r of runs) {
    const avgL = (hexToOklab(surface[r.from]).L + hexToOklab(surface[r.to]).L) / 2;
    r.side = avgL > baseL ? 'lighter' : 'darker';
  }
  const tones = [...new Set(pairs.flatMap((p) => [p.from, p.to]))].sort((a, b) => a - b);
  return { limit, pairs, runs, tones, total: levels.length, min: levels.length > 1 ? min : 0 };
}
