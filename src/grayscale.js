// Escala de cinzas. No Aplica ela é fixa (não calculada) e pode ser sobrescrita pelo tema.
import { colorAtLightness, contrastRatio } from './color.js';
import { resolvePreset } from './presets.js';
import { neutralsLightness } from './scale.js';
import { normalizeHex } from './color.js';

function ramp(preset) {
  const { levels } = preset.neutrals;
  const surface = {}, txtOn = {}, border = {};
  for (const level of levels) {
    surface[level] = colorAtLightness({ C: 0, h: 0 }, neutralsLightness(level, preset), 1);
    txtOn[level] = contrastRatio(surface[level], '#000000') >= 4.5 ? '#000000' : '#ffffff';
  }
  levels.forEach((level, i) => { border[level] = i < levels.length - 1 ? surface[levels[i + 1]] : '#000000'; });
  return { surface, txtOn, border };
}

const validated = (scale, levels, where) => {
  const out = {};
  for (const [level, value] of Object.entries(scale ?? {})) {
    if (!levels.includes(Number(level))) throw new Error(`${where}: o nível ${level} não existe (${levels.join(', ')}).`);
    out[level] = normalizeHex(value, `${where}.${level}`);
  }
  return out;
};

// As mesmas cores, com os níveis em ordem invertida (5↔140, 10↔130, ...).
const reverseKeys = (scale, levels) =>
  Object.fromEntries(levels.map((l, i) => [levels[levels.length - 1 - i], scale[l]]));

// No dark a borda é a superfície do passo seguinte (um passo mais clara).
function borderFromSurface(surface, levels, steps) {
  const out = {};
  levels.forEach((l, i) => { out[l] = surface[levels[Math.min(i + steps, levels.length - 1)]] ?? surface[l]; });
  return out;
}

/**
 * @param {object} [input]
 * @param {string|object} [input.preset]
 * @param {object} [input.overrides]  { surface, txtOn, border } (vale para o light; o dark é o espelho)
 *                                    ou { light: {...}, dark: {...} } com o dark já na orientação do dark
 * @param {number} [input.borderOffset] passos da borda do dark (padrão 1)
 */
export function generateGrayscale({ preset = 'aplica', overrides = null, borderOffset = 1 } = {}) {
  const p = resolvePreset(preset);
  const levels = p.neutrals.levels;
  const defaults = p.grayscale ?? ramp(p);
  const steps = Math.max(1, Math.round(borderOffset) || 1);
  const explicit = overrides && ('light' in overrides || 'dark' in overrides);

  const lightOv = explicit ? overrides.light : overrides;
  const light = {
    surface: { ...defaults.surface, ...validated(lightOv?.surface, levels, 'grayscale.surface') },
    txtOn: { ...defaults.txtOn, ...validated(lightOv?.txtOn, levels, 'grayscale.txtOn') },
    border: { ...defaults.border, ...validated(lightOv?.border, levels, 'grayscale.border') }
  };

  let dark;
  if (explicit) {
    const base = {
      surface: reverseKeys(defaults.surface, levels),
      txtOn: reverseKeys(defaults.txtOn, levels)
    };
    const surface = { ...base.surface, ...validated(overrides.dark?.surface, levels, 'grayscale.dark.surface') };
    dark = {
      surface,
      txtOn: { ...base.txtOn, ...validated(overrides.dark?.txtOn, levels, 'grayscale.dark.txtOn') },
      border: { ...borderFromSurface(surface, levels, steps), ...validated(overrides.dark?.border, levels, 'grayscale.dark.border') }
    };
  } else {
    const surface = reverseKeys(light.surface, levels);
    dark = { surface, txtOn: reverseKeys(light.txtOn, levels), border: borderFromSurface(surface, levels, steps) };
  }
  return { preset: p.id, light, dark };
}
