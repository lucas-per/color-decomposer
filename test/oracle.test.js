import test from 'node:test';
import assert from 'node:assert/strict';
import { ColorDecomposer } from './oracle/aplica-color-decomposer.mjs';
import { decompose } from '../src/index.js';

// Compara o motor com o ColorDecomposer oficial (3.23.4) em muitas cores e combinações de opções.

const quiet = async (fn) => {
  const w = console.warn;
  console.warn = () => {};
  try { return await fn(); } finally { console.warn = w; }
};

// Cores determinísticas: gerador congruencial simples, para o teste ser reproduzível.
function colors(n) {
  let s = 20261009;
  const next = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
  const fixed = ['#e7398a', '#38c2d0', '#ffcc00', '#000000', '#ffffff', '#808080', '#ff0000', '#00ff00', '#0000ff', '#013fc4', '#d2fd9d'];
  const out = [...fixed];
  while (out.length < n) {
    out.push('#' + [0, 1, 2].map(() => Math.floor(next() * 256).toString(16).padStart(2, '0')).join(''));
  }
  return out;
}

const SCENARIOS = [
  { name: 'padrão', mine: {}, theirs: {} },
  { name: 'brand-tint', mine: { txtOnStrategy: 'brand-tint' }, theirs: { txtOnStrategy: 'brand-tint' } },
  { name: 'brand-tint startLight', mine: { txtOnStrategy: 'brand-tint', colorContrastDecompose: 'startLight' }, theirs: { txtOnStrategy: 'brand-tint', colorContrastDecompose: 'startLight' } },
  { name: 'brand-tint overlap 100', mine: { txtOnStrategy: 'brand-tint', overlap: { level: 100 } }, theirs: { txtOnStrategy: 'brand-tint', overlap: { level: 100 } } },
  { name: 'high-contrast startLight', mine: { colorContrastDecompose: 'startLight' }, theirs: { colorContrastDecompose: 'startLight' } },
  {
    name: 'custom-tint (fallback brand-tint)',
    mine: { txtOnStrategy: 'custom-tint', txtOnCustomTint: { light: '#1a1a1a', dark: '#f5f5f5', fallback: 'brand-tint' } },
    theirs: { txtOnStrategy: 'custom-tint', txtOnCustomTint: { light: '#1a1a1a', dark: '#f5f5f5', fallback: 'brand-tint' } }
  },
  {
    name: 'custom-tint (fallback high-contrast, só claro)',
    mine: { txtOnStrategy: 'custom-tint', txtOnCustomTint: { light: '#222222', fallback: 'high-contrast' } },
    theirs: { txtOnStrategy: 'custom-tint', txtOnCustomTint: { light: '#222222', fallback: 'high-contrast' } }
  },
  { name: 'AAA aceitando AA', mine: { accessibilityLevel: 'AAA', onAccessibilityFailure: 'accept-aa' }, theirs: { accessibilityLevel: 'AAA', acceptAALevelFallback: true, interactiveFallback: false } },
  { name: 'AAA mantendo falhas', mine: { accessibilityLevel: 'AAA', onAccessibilityFailure: 'warn' }, theirs: { accessibilityLevel: 'AAA', interactiveFallback: false } },
  { name: 'AAA brand-tint aceitando AA', mine: { txtOnStrategy: 'brand-tint', accessibilityLevel: 'AAA', onAccessibilityFailure: 'accept-aa' }, theirs: { txtOnStrategy: 'brand-tint', accessibilityLevel: 'AAA', acceptAALevelFallback: true, interactiveFallback: false } },
  { name: 'darkModeChroma 0.6', mine: { darkModeChroma: 0.6 }, theirs: { darkModeChroma: 0.6 } },
  { name: 'borderOffset 30/2', mine: { borderOffset: { palette: 30, neutrals: 2 } }, theirs: { borderOffset: { palette: 30, neutrals: 2 } } },
  { name: 'txt (generateTxt)', mine: { generateTxt: true, txtBaseColorLevel: 100 }, theirs: { generateTxt: true, txtBaseColorLevel: 100 } }
];

const SCALES = ['surface', 'txtOn', 'border', 'txt'];

function compareGroup(ctx, mine, theirs) {
  for (const k of SCALES) {
    if (theirs[k] === undefined && mine[k] === undefined) continue;
    assert.deepEqual(
      Object.fromEntries(Object.entries(mine[k] ?? {}).map(([l, v]) => [l, v.toLowerCase()])),
      Object.fromEntries(Object.entries(theirs[k] ?? {}).map(([l, v]) => [l, v.toLowerCase()])),
      `${ctx} ${k}`
    );
  }
}

for (const sc of SCENARIOS) {
  test(`paridade com o oficial: ${sc.name}`, async () => {
    const official = new ColorDecomposer(sc.theirs);
    for (const hex of colors(60)) {
      const mine = decompose({ base: hex, options: sc.mine });
      for (const mode of ['light', 'dark']) {
        // O oficial descobre o nível do overlap procurando o hex na paleta; com hex repetido (tons
        // sem croma, nos extremos) ele acha o primeiro nível igual. Nós usamos o nível declarado.
        const values = Object.values(mine[mode].palette.surface);
        if (sc.mine.overlap && new Set(values).size !== values.length) continue;
        const theirs = await quiet(() => official.decompose('x', hex, mode));
        compareGroup(`${hex} ${mode} palette`, mine[mode].palette, theirs.palette);
        compareGroup(`${hex} ${mode} neutrals`, mine[mode].neutrals, theirs.neutrals);
        // behavior: o oficial devolve referências; conferimos os níveis de origem
        const refs = theirs.behavior.surface;
        for (const [name, ref] of Object.entries(refs)) {
          const level = Number(/surface\.(\d+)\}/.exec(ref)[1]);
          assert.equal(mine[mode].behavior.level[name], level);
          assert.equal(mine[mode].behavior.surface[name], mine[mode].palette.surface[level]);
        }
      }
    }
  });
}

test('paridade com o oficial: sobrescrita dos neutros (baseColor + referenceLevel + surface/txtOn/border)', async () => {
  const override = {
    baseColor: '#5a5a7a',
    referenceLevel: 80,
    surface: { 5: '#fafafa', 140: '#0a0a12' },
    txtOn: { 5: '#222222', 100: '#fefefe' },
    border: { 10: '#cccccc' }
  };
  const official = new ColorDecomposer({});
  for (const hex of colors(15)) {
    const mine = decompose({ base: hex, neutralsOverride: { light: override, dark: override } });
    for (const mode of ['light', 'dark']) {
      const theirs = await quiet(() => official.decompose('x', hex, mode, override));
      compareGroup(`${hex} ${mode} neutrals`, mine[mode].neutrals, theirs.neutrals);
    }
  }
});

test('paridade com o oficial: sobrescrita só de superfície no bloco legado (sem baseColor)', async () => {
  // Bloco único = light; o dark é o espelho (5↔140, 10↔130...). Igual ao Blue Sky.
  const legacy = { surface: { 5: '#f6f3f5', 70: '#8b69ce', 140: '#010104' } };
  const darkMirror = { surface: { 140: '#f6f3f5', 70: '#8b69ce', 5: '#010104' } };
  const official = new ColorDecomposer({});
  for (const hex of colors(10)) {
    const mine = decompose({ base: hex, neutralsOverride: legacy });
    const l = await quiet(() => official.decompose('x', hex, 'light', legacy));
    const d = await quiet(() => official.decompose('x', hex, 'dark', darkMirror));
    compareGroup(`${hex} light`, mine.light.neutrals, l.neutrals);
    compareGroup(`${hex} dark`, mine.dark.neutrals, d.neutrals);
  }
});

test('overlap usa o nível declarado mesmo quando há superfícies repetidas', () => {
  // Preto puro: muitas superfícies iguais no dark. O nível 100 está no overlap e vai direto ao alto contraste.
  const r = decompose({ base: '#000000', options: { txtOnStrategy: 'brand-tint', overlap: { level: 100 } } });
  for (const level of [100, 110, 190]) {
    assert.match(r.dark.palette.txtOn[level], /^#(000000|ffffff)$/);
  }
});
