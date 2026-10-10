// Decomposição de uma cor de marca em paleta, neutros e behavior, para light e dark.
import { normalizeHex, hexToOklch, colorAtLightness } from './color.js';
import { resolvePreset } from './presets.js';
import { resolveOptions } from './options.js';
import { paletteLightness, neutralsLightness, mirrorSum, behaviorLevels } from './scale.js';
import { txtOnFor, checkPair, resolveFailures } from './txton.js';

const MODES = ['light', 'dark'];

// Referência de texto (txt): um único valor, tirado do nível mais próximo de txtBaseColorLevel.
function txtScale(cfg, surface, border, levels) {
  const target = levels.reduce((best, l) =>
    Math.abs(l - cfg.txtBaseColorLevel) < Math.abs(best - cfg.txtBaseColorLevel) ? l : best, levels[0]);
  const value = surface[target] ?? border[target] ?? '#000000';
  return Object.fromEntries(levels.map((l) => [l, value]));
}

function borderBySteps(levels, surface, steps) {
  const border = {};
  levels.forEach((level, i) => {
    border[level] = surface[levels[Math.min(i + steps, levels.length - 1)]];
  });
  return border;
}

function generatePalette(cfg, preset, baseHex, mode, warnings) {
  const { levels } = preset.palette;
  const anchor = cfg.brandLevel;
  const base = hexToOklch(baseHex);
  const sum = mirrorSum(levels);
  const chroma = mode === 'dark' ? cfg.darkModeChroma : 1;

  const surface = {};
  for (const level of levels) {
    const source = mode === 'dark' ? sum - level : level;
    if (source === anchor) { surface[level] = baseHex; continue; } // a marca, sem ida e volta por OKLCh
    surface[level] = colorAtLightness(base, paletteLightness(source, base.L, preset, anchor), chroma);
  }

  const border = borderBySteps(levels, surface, cfg.borderSteps.palette);

  const txtOn = {};
  for (const level of levels) {
    txtOn[level] = txtOnFor(cfg, surface[level], mode, { paletteSurface: surface, levels, level });
  }
  resolveFailures(cfg, { group: 'palette', mode, levels, surface, txtOn }, warnings);

  const out = { surface, txtOn, border };
  if (cfg.generateTxt) out.txt = txtScale(cfg, surface, border, levels);
  return out;
}

function generateNeutrals(cfg, preset, baseHex, mode, override, warnings) {
  const { levels, chroma: baseChroma } = preset.neutrals;
  const sum = mirrorSum(levels);

  const ownBase = override?.baseColor ? normalizeHex(override.baseColor, 'neutros.baseColor') : null;
  const origin = hexToOklch(ownBase ?? baseHex);
  const reference = ownBase
    ? { level: override.referenceLevel ?? preset.neutrals.referenceLevel, L: origin.L }
    : null;
  if (reference && !levels.includes(reference.level)) {
    throw new Error(`neutros.referenceLevel ${reference.level} não existe no preset (${levels.join(', ')}).`);
  }
  const chroma = (ownBase ? 1 : baseChroma) * (mode === 'dark' ? cfg.darkModeChroma : 1);

  const surface = {};
  for (const level of levels) {
    const source = mode === 'dark' ? sum - level : level;
    surface[level] = colorAtLightness(origin, neutralsLightness(source, preset, reference), chroma);
  }
  // Como no Aplica, a borda vem das superfícies geradas: sobrescrever a superfície não muda a borda.
  const border = borderBySteps(levels, surface, cfg.borderSteps.neutrals);
  for (const [level, value] of Object.entries(override?.border ?? {})) {
    assertLevel(levels, level, 'neutros.border');
    border[level] = normalizeHex(value, `neutros.border.${level}`);
  }
  for (const [level, value] of Object.entries(override?.surface ?? {})) {
    assertLevel(levels, level, 'neutros.surface');
    surface[level] = normalizeHex(value, `neutros.surface.${level}`);
  }


  const txtOn = {};
  const manual = [];
  for (const level of levels) {
    const given = override?.txtOn?.[level];
    if (given) {
      txtOn[level] = normalizeHex(given, `neutros.txtOn.${level}`);
      manual.push(level);
    } else {
      txtOn[level] = txtOnFor(cfg, surface[level], mode);
    }
  }
  for (const level of Object.keys(override?.txtOn ?? {})) assertLevel(levels, level, 'neutros.txtOn');

  // Textos informados à mão só geram aviso (ou erro, no modo "throw"); os gerados seguem a política AAA.
  for (const level of manual) {
    const check = checkPair(surface[level], txtOn[level], cfg.requiredRatio);
    if (check.passes) continue;
    if (cfg.onAccessibilityFailure === 'throw') {
      throw new Error(`neutros.txtOn.${level} (${mode}) não atinge ${cfg.accessibilityLevel}: ${check.ratio.toFixed(2)}:1.`);
    }
    warnings.push({
      type: 'override', group: 'neutrals', mode, level,
      surface: surface[level], txtOn: txtOn[level],
      ratio: check.ratio, required: cfg.requiredRatio, accepted: null
    });
  }
  const generated = levels.filter((l) => !manual.includes(l));
  resolveFailures(cfg, { group: 'neutrals', mode, levels: generated, surface, txtOn, recheck: false }, warnings);

  const out = { surface, txtOn, border };
  if (cfg.generateTxt) out.txt = txtScale(cfg, surface, border, levels);
  return out;
}

function assertLevel(levels, level, where) {
  if (!levels.includes(Number(level))) throw new Error(`${where}: o nível ${level} não existe (${levels.join(', ')}).`);
}

// Behavior são apelidos de níveis da paleta; guardamos o valor já resolvido e o nível de origem.
function generateBehavior(cfg, preset, palette, mode) {
  const out = { surface: {}, txtOn: {}, border: {}, level: {} };
  if (cfg.generateTxt) out.txt = {};
  // Por padrão os estados ficam nos níveis do preset. Com `behaviorFollowsBrand`, o "normal" acompanha a marca
  // (no escuro, o nível espelhado) e os outros estados se ajustam em volta dela.
  const { levels } = preset.palette;
  const brand = mode === 'dark' ? levels[0] + levels[levels.length - 1] - cfg.brandLevel : cfg.brandLevel;
  const behavior = cfg.behaviorFollowsBrand ? behaviorLevels(preset, brand) : preset.behavior;
  for (const [name, level] of Object.entries(behavior)) {
    out.surface[name] = palette.surface[level];
    out.txtOn[name] = palette.txtOn[level];
    out.border[name] = palette.border[level];
    out.level[name] = level;
    if (cfg.generateTxt) out.txt[name] = palette.txt[level];
  }
  return out;
}

// Bloco de sobrescrita dos neutros → { light, dark }.
// Aceita { light, dark } ou um bloco único, tratado como light; o dark vira o espelho dele.
export function normalizeNeutralsOverride(raw, preset) {
  if (!raw) return { light: null, dark: null };
  if ('light' in raw || 'dark' in raw) return { light: raw.light ?? null, dark: raw.dark ?? null };

  const levels = preset.neutrals.levels;
  const reverse = Object.fromEntries(levels.map((l, i) => [l, levels[levels.length - 1 - i]]));
  const mirror = (scale) => scale && Object.fromEntries(Object.entries(scale).map(([l, v]) => [reverse[l] ?? l, v]));
  return {
    light: raw,
    dark: {
      baseColor: raw.baseColor,
      referenceLevel: raw.referenceLevel,
      surface: mirror(raw.surface),
      txtOn: mirror(raw.txtOn),
      border: mirror(raw.border)
    }
  };
}

/**
 * Decompõe uma cor de marca.
 * @param {object} input
 * @param {string} input.base            cor da marca (#RRGGBB)
 * @param {string} [input.name]          nome do alias (só para identificar o resultado)
 * @param {string|object} [input.preset] "aplica" (padrão), "custom" ou um objeto de preset
 * @param {object} [input.options]       opções (ver options.js)
 * @param {object} [input.neutralsOverride]
 * @param {object[]} [input.warnings]    lista onde acumular avisos (uso interno de decomposeTheme)
 */
export function decompose({ base, name = 'color', preset = 'aplica', options = {}, neutralsOverride = null, warnings = [] }) {
  const p = resolvePreset(preset);
  const baseHex = normalizeHex(base, 'cor da marca');
  const cfg = resolveOptions(options, p, warnings);
  const overrides = normalizeNeutralsOverride(neutralsOverride, p);

  const result = { name, base: baseHex, preset: p.id, light: null, dark: null, warnings };
  for (const mode of MODES) {
    const palette = generatePalette(cfg, p, baseHex, mode, warnings);
    const neutrals = generateNeutrals(cfg, p, baseHex, mode, overrides[mode], warnings);
    result[mode] = { palette, neutrals, behavior: generateBehavior(cfg, p, palette, mode) };
  }
  return result;
}

export { MODES };
