import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decomposeTheme, toPrimitiveTheme, toGrayscaleTheme } from '../src/index.js';

const here = path.dirname(fileURLToPath(import.meta.url));
export const readJson = (...p) => JSON.parse(fs.readFileSync(path.join(here, ...p), 'utf8'));

// Converte a configuração do Aplica para as entradas do motor. O Aplica gera `txt` nos temas de exemplo
// e o Joy foi gerado aceitando AA quando o AAA falha.
export function buildFromFixture(dir, extra = {}) {
  const cfg = readJson('fixtures', dir, 'config.json');
  const theme = decomposeTheme({
    colors: cfg.colors,
    options: { ...cfg.options, generateTxt: true, onAccessibilityFailure: 'accept-aa', ...extra },
    neutralsOverrides: cfg.neutralsOverrides,
    grayscaleOverrides: cfg.grayscaleOverrides
  });
  return { cfg, theme, primitive: toPrimitiveTheme(theme), grayscale: toGrayscaleTheme(theme) };
}

// Lista as diferenças entre dois blocos de tokens, ignorando maiúsculas/minúsculas no hex.
export function diffTokens(actual, expected, prefix = '') {
  const diffs = [];
  const keys = new Set([...Object.keys(actual ?? {}), ...Object.keys(expected ?? {})]);
  for (const k of keys) {
    const a = actual?.[k], e = expected?.[k];
    const here = prefix ? `${prefix}.${k}` : k;
    if (a && typeof a === 'object' && '$value' in a || e && typeof e === 'object' && '$value' in e) {
      if (String(a?.$value).toLowerCase() !== String(e?.$value).toLowerCase()) diffs.push(`${here}: ${a?.$value} ≠ ${e?.$value}`);
    } else if ((a && typeof a === 'object') || (e && typeof e === 'object')) {
      diffs.push(...diffTokens(a, e, here));
    } else if (a !== e) {
      diffs.push(`${here}: ${a} ≠ ${e}`);
    }
  }
  return diffs;
}
