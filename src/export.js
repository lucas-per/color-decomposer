// Exportação do resultado em formatos prontos para colar em código ou ferramentas de tokens.

const SCALES = ['surface', 'txtOn', 'border', 'txt'];

const slug = (s) => String(s).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'cor';

function cssBlock(selector, theme, mode) {
  const lines = [];
  for (const [name, color] of Object.entries(theme.colors)) {
    const data = color[mode];
    for (const group of ['palette', 'neutrals', 'behavior']) {
      for (const scale of SCALES) {
        const values = data[group][scale];
        if (!values) continue;
        for (const [level, value] of Object.entries(values)) {
          lines.push(`  --${slug(name)}-${group}-${scale}-${level}: ${value};`);
        }
      }
    }
  }
  const gray = theme.grayscale?.[mode];
  if (gray) {
    for (const scale of SCALES) {
      for (const [level, value] of Object.entries(gray[scale] ?? {})) lines.push(`  --grayscale-${scale}-${level}: ${value};`);
    }
  }
  return `${selector} {\n${lines.join('\n')}\n}`;
}

// Variáveis CSS: o claro em :root, o escuro em [data-theme="dark"].
export function toCssVariables(theme) {
  return `${cssBlock(':root, [data-theme="light"]', theme, 'light')}\n\n${cssBlock('[data-theme="dark"]', theme, 'dark')}\n`;
}

// Resultado completo, sem os avisos internos de configuração.
export function toPlainJson(theme) {
  return `${JSON.stringify({ preset: theme.preset, colors: theme.colors, grayscale: theme.grayscale, warnings: theme.warnings }, null, 2)}\n`;
}

// ---------------------------------------------------------------------------
// Figma: lista de variables com dois modos, lida pelo plugin em figma-plugin/.
// ---------------------------------------------------------------------------

export const FIGMA_FORMAT = 'color-decomposer/figma-variables';
export const FIGMA_MODES = { light: 'Claro', dark: 'Escuro' };
export const FIGMA_COLLECTIONS = { primitives: 'Primitivos', semantic: 'Semântica' };

const nameOf = (s) => String(s).trim().replace(/[\/\\]+/g, '-') || 'cor';

/**
 * Coleção "Primitivos": palette, neutros e cinzas (surface, txtOn, border e, se existir, txt),
 * com o valor de cada modo. Coleção "Semântica": os tons de comportamento, como alias do tom
 * da paleta que cada um usa. Cada modo aponta para a variable de mesmo nível, que já guarda
 * o valor daquele modo.
 * `samples` descreve as faixas que o plugin desenha na página de amostras.
 */
export function toFigmaVariables(theme) {
  const primitives = [];
  const semantic = [];
  const samples = [];

  const pair = (read) => ({ [FIGMA_MODES.light]: read('light'), [FIGMA_MODES.dark]: read('dark') });
  const scalesOf = (name, group) => ['surface', 'txtOn', 'border', 'txt'].filter((s) => theme.colors[name].light[group][s]);

  for (const [alias, color] of Object.entries(theme.colors)) {
    const id = nameOf(alias);
    for (const group of ['palette', 'neutrals']) {
      const scales = scalesOf(alias, group);
      const levels = Object.keys(color.light[group].surface);
      for (const scale of scales) {
        for (const level of levels) {
          primitives.push({ name: `${id}/${group}/${scale}/${level}`, scale, values: pair((m) => color[m][group][scale][level]) });
        }
      }
      samples.push({
        title: `${alias}: ${group === 'palette' ? 'paleta' : 'neutros'}`,
        items: levels.map((level) => ({
          label: level,
          surface: `${id}/${group}/surface/${level}`,
          txtOn: `${id}/${group}/txtOn/${level}`,
          border: `${id}/${group}/border/${level}`
        }))
      });
    }

    const names = Object.keys(color.light.behavior.surface);
    for (const state of names) {
      for (const scale of scalesOf(alias, 'behavior')) {
        const target = (m) => `${id}/palette/${scale}/${color[m].behavior.level[state]}`;
        semantic.push({ name: `${id}/behavior/${state}/${scale}`, scale, aliases: pair(target) });
      }
    }
    samples.push({
      title: `${alias}: comportamento`,
      items: names.map((state) => ({
        label: state,
        surface: `${id}/behavior/${state}/surface`,
        txtOn: `${id}/behavior/${state}/txtOn`,
        border: `${id}/behavior/${state}/border`
      }))
    });
  }

  const gray = theme.grayscale;
  if (gray) {
    const levels = Object.keys(gray.light.surface);
    for (const scale of ['surface', 'txtOn', 'border', 'txt']) {
      if (!gray.light[scale]) continue;
      for (const level of levels) {
        primitives.push({ name: `grayscale/${scale}/${level}`, scale, values: pair((m) => gray[m][scale][level]) });
      }
    }
    samples.push({
      title: 'Cinzas',
      items: levels.map((level) => ({
        label: level, surface: `grayscale/surface/${level}`, txtOn: `grayscale/txtOn/${level}`, border: `grayscale/border/${level}`
      }))
    });
  }

  const first = nameOf(Object.keys(theme.colors)[0]);
  const neutralLevels = Object.keys(theme.colors[Object.keys(theme.colors)[0]].light.neutrals.surface);
  return {
    format: FIGMA_FORMAT,
    version: 1,
    modes: [FIGMA_MODES.light, FIGMA_MODES.dark],
    collections: [
      { name: FIGMA_COLLECTIONS.primitives, variables: primitives },
      { name: FIGMA_COLLECTIONS.semantic, variables: semantic }
    ],
    // fundo e texto das telas de amostra: os neutros da primeira cor
    canvas: {
      fill: `${first}/neutrals/surface/${neutralLevels[0]}`,
      text: `${first}/neutrals/surface/${neutralLevels.at(-1)}`
    },
    samples
  };
}

export function toFigmaJson(theme) {
  return `${JSON.stringify(toFigmaVariables(theme), null, 2)}\n`;
}
