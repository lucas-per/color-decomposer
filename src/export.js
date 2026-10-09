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
