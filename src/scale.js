// Interpolação de luminosidade (L em OKLCh) e espelhamento para o dark.

// Paleta: do primeiro nível (lightest) até a cor da marca, e da marca até o último (darkest).
// `anchor` é o nível onde a cor da marca fica (padrão: o baseLevel do preset).
export function paletteLightness(level, baseL, preset, anchor = preset.palette.baseLevel) {
  const { levels, lightest, darkest } = preset.palette;
  const baseLevel = anchor;
  const first = levels[0], last = levels[levels.length - 1];
  if (level <= baseLevel) {
    const t = (level - first) / (baseLevel - first);
    return lightest - t * (lightest - baseL);
  }
  const t = (level - baseLevel) / (last - baseLevel);
  return baseL - t * (baseL - darkest);
}

// Neutros sem referência: rampa linear do primeiro ao último nível.
// Com referência (cor própria num nível): passa por ela.
export function neutralsLightness(level, preset, reference = null) {
  const { levels, lightest, darkest } = preset.neutrals;
  const first = levels[0], last = levels[levels.length - 1];
  if (!reference) {
    const t = (level - first) / (last - first);
    return lightest - t * (lightest - darkest);
  }
  const { level: refLevel, L: refL } = reference;
  if (level === refLevel) return refL;
  if (level < refLevel) {
    const t = (level - first) / (refLevel - first);
    return lightest - t * (lightest - refL);
  }
  const t = (level - refLevel) / (last - refLevel);
  return refL - t * (refL - darkest);
}

// Nível espelhado do dark: primeiro + último - nível (Aplica: 200 na paleta, 145 nos neutros).
export const mirrorSum = (levels) => levels[0] + levels[levels.length - 1];
