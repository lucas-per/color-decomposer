// Cor viva: mede quanto a paleta mudaria com a opção `vividChroma`, para a interface só oferecê-la quando faz diferença.
import { colorAtLightness, deltaEOk, hexToOklch } from './color.js';
import { paletteLightness, vividWeight } from './scale.js';
import { resolvePreset } from './presets.js';

// Maior distância perceptual (ΔE OK) entre um tom normal e o mesmo tom com cor viva, no modo claro.
// Calibrado com cores conhecidas: âmbar, rosa e azul dão 0; verde dá ~0,03; bege dá ~0,05; off-white, creme e cinzas azulados dão 0,06 ou mais.
// Fica perto de 0 quando a cor já é intensa (a opção não muda nada) ou não tem matiz (cinza).
export const VIVID_VISIBLE_LIMIT = 0.045;

export function vividGain(baseHex, preset = 'aplica', anchor) {
  const p = resolvePreset(preset);
  const base = hexToOklch(baseHex);
  const at = anchor ?? p.palette.baseLevel;
  let max = 0;
  for (const level of p.palette.levels) {
    if (level === at) continue;
    const L = paletteLightness(level, base.L, p, at);
    max = Math.max(max, deltaEOk(colorAtLightness(base, L), colorAtLightness(base, L, 1, vividWeight(level, at, p))));
  }
  return max;
}
