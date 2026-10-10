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

// Níveis dos estados de comportamento quando a marca está em `anchor` (e não no baseLevel do preset).
// Os estados mais claros que o "normal" se espalham entre o primeiro nível e a marca; os mais escuros,
// entre a marca e o último. Cada lado mantém a ordem e, se couber, níveis diferentes.
export function behaviorLevels(preset, anchor) {
  const { levels, baseLevel, step } = preset.palette;
  if (anchor === baseLevel) return { ...preset.behavior };
  const first = levels[0], last = levels[levels.length - 1];
  const snap = (v) => levels.reduce((best, l) => (Math.abs(l - v) < Math.abs(best - v) ? l : best), first);
  const entries = Object.entries(preset.behavior);
  const out = {};

  const spread = (items, lo, hi, project) => {
    items.sort((a, b) => a[1] - b[1]);
    const t = items.map(([, orig]) => snap(project(orig)));
    if (hi - lo < (items.length - 1) * step) {
      items.forEach(([name], i) => { out[name] = Math.min(hi, Math.max(lo, t[i])); });
      return;
    }
    for (let i = 0; i < t.length; i++) t[i] = Math.max(t[i], i ? t[i - 1] + step : lo);
    for (let i = t.length - 1; i >= 0; i--) t[i] = Math.min(t[i], i < t.length - 1 ? t[i + 1] - step : hi);
    items.forEach(([name], i) => { out[name] = t[i]; });
  };

  for (const [name, orig] of entries) if (orig === baseLevel) out[name] = anchor;
  spread(entries.filter(([, o]) => o < baseLevel), first, Math.max(first, anchor - step),
    (o) => first + ((o - first) * (anchor - first)) / (baseLevel - first));
  spread(entries.filter(([, o]) => o > baseLevel), Math.min(last, anchor + step), last,
    (o) => anchor + ((o - baseLevel) * (last - anchor)) / (last - baseLevel));
  return Object.fromEntries(entries.map(([name]) => [name, out[name]]));
}
