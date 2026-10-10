// Camada de tema: várias cores + escala de cinzas, e exportação no formato de tokens do Aplica.
import { decompose } from './decompose.js';
import { generateGrayscale } from './grayscale.js';
import { resolvePreset } from './presets.js';
import { resolveOptions } from './options.js';
import { txtScaleFor } from './txt.js';

/**
 * @param {object} config
 * @param {Object<string,string>} config.colors   alias → #RRGGBB
 * @param {string|object} [config.preset]
 * @param {object} [config.options]
 * @param {Object<string,object>} [config.neutralsOverrides]  alias → bloco de sobrescrita dos neutros
 * @param {object} [config.grayscaleOverrides]
 * @param {{color?: string, level?: number}} [config.ambient]  fundo usado para validar o `txt`
 *        (padrão: neutros da primeira cor, no primeiro nível da escala, como o Aplica)
 */
export function decomposeTheme({ colors, preset = 'aplica', options = {}, neutralsOverrides = {}, grayscaleOverrides = null, ambient = {} }) {
  if (!colors || !Object.keys(colors).length) throw new Error('Informe ao menos uma cor em "colors".');
  const p = resolvePreset(preset);
  const warnings = [];
  const out = {};
  for (const [name, base] of Object.entries(colors)) {
    const r = decompose({ name, base, preset: p, options, neutralsOverride: neutralsOverrides[name] ?? null, warnings });
    out[name] = { base: r.base, light: r.light, dark: r.dark };
  }
  const grayscale = generateGrayscale({ preset: p, overrides: grayscaleOverrides, borderOffset: options.borderOffset?.grayscale });

  const cfg = resolveOptions(options, p);
  if (cfg.generateTxt) applyAmbientTxt(out, grayscale, p, cfg, ambient);
  return { preset: p.id, colors: out, grayscale, warnings };
}

const token = (value) => ({ $type: 'color', $value: value });
const tokens = (scale) => Object.fromEntries(Object.entries(scale).map(([k, v]) => [k, token(v)]));
const group = (g) => Object.fromEntries(
  Object.entries(g).filter(([k]) => k !== 'level').map(([k, scale]) => [k, tokens(scale)])
);

// Mesmo formato do _primitive_theme.json do Aplica (behavior já resolvido em cores).
export function toPrimitiveTheme(theme) {
  const mode = { light: {}, dark: {} };
  for (const [name, c] of Object.entries(theme.colors)) {
    for (const m of ['light', 'dark']) {
      mode[m][name] = { palette: group(c[m].palette), neutrals: group(c[m].neutrals), behavior: group(c[m].behavior) };
    }
  }
  return { _color_palette: { mode } };
}

// Mesmo formato do _grayscale.json do Aplica.
export function toGrayscaleTheme(theme) {
  const g = theme.grayscale;
  const block = (m) => ({
    surface: tokens(m.surface), txtOn: tokens(m.txtOn), border: tokens(m.border),
    ...(m.txt ? { txt: tokens(m.txt) } : {})
  });
  return { _color_palette: { mode: { light: { grayscale: block(g.light) }, dark: { grayscale: block(g.dark) } } } };
}

// O `txt` de cada escala vira um único valor que passa no contraste contra o fundo ambiente.
function applyAmbientTxt(colors, grayscale, preset, cfg, ambient) {
  const alias = ambient.color ?? Object.keys(colors)[0];
  if (!colors[alias]) throw new Error(`ambient.color "${alias}" não existe em "colors".`);
  const level = ambient.level ?? preset.neutrals.levels[0];
  if (!preset.neutrals.levels.includes(level)) throw new Error(`ambient.level ${level} não existe nos neutros do preset.`);

  for (const mode of ['light', 'dark']) {
    const background = colors[alias][mode].neutrals.surface[level];
    for (const c of Object.values(colors)) {
      const m = c[mode];
      m.palette.txt = txtScaleFor(m.palette.surface, background, cfg);
      m.neutrals.txt = txtScaleFor(m.neutrals.surface, background, cfg);
      for (const [name, lvl] of Object.entries(m.behavior.level)) m.behavior.txt[name] = m.palette.txt[lvl];
    }
    grayscale[mode].txt = txtScaleFor(grayscale[mode].surface, background, cfg);
  }
}
