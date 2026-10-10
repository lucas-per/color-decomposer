import test from 'node:test';
import assert from 'node:assert/strict';
import {
  decompose, decomposeTheme, generateGrayscale, auditResult, toPrimitiveTheme,
  contrastRatio, hexToOklch, PRESETS, resolvePreset
} from '../src/index.js';
import { neutralsLightness } from '../src/scale.js';

const SAMPLE = ['#e7398a', '#38c2d0', '#ffcc00', '#013fc4', '#808080', '#d2fd9d', '#b200af', '#000000', '#ffffff'];

test('contraste: preto sobre branco é 21:1', () => {
  assert.equal(Math.round(contrastRatio('#000000', '#ffffff')), 21);
});

for (const presetId of Object.keys(PRESETS)) {
  const preset = PRESETS[presetId];
  const palette = preset.palette.levels;
  const neutrals = preset.neutrals.levels;
  const mirrorP = palette[0] + palette.at(-1);
  const mirrorN = neutrals[0] + neutrals.at(-1);

  test(`${presetId}: o nível da marca é a cor exata, em light e dark`, () => {
    for (const hex of SAMPLE) {
      const r = decompose({ base: hex, preset: presetId });
      assert.equal(r.light.palette.surface[preset.palette.baseLevel], hex);
      assert.equal(r.dark.palette.surface[preset.palette.baseLevel], hex);
    }
  });

  test(`${presetId}: primeiro nível é o mais claro e o último o mais escuro (light)`, () => {
    const r = decompose({ base: '#e7398a', preset: presetId });
    const L = palette.map((l) => hexToOklch(r.light.palette.surface[l]).L);
    for (let i = 1; i < L.length; i++) assert.ok(L[i] < L[i - 1], `nível ${palette[i]} deveria ser mais escuro que ${palette[i - 1]}`);
    assert.ok(L[0] > 0.85 && L.at(-1) < 0.2); // o recorte de gamut tira alguns centésimos do alvo (0,98 e 0,05)
    const N = neutrals.map((l) => hexToOklch(r.light.neutrals.surface[l]).L);
    for (let i = 1; i < N.length; i++) assert.ok(N[i] < N[i - 1]);
  });

  test(`${presetId}: o dark é o espelho (paleta ${mirrorP}, neutros ${mirrorN}) com croma reduzido`, () => {
    const r = decompose({ base: '#38c2d0', preset: presetId });
    for (const l of palette.filter((x) => x !== preset.palette.baseLevel)) {
      const dark = hexToOklch(r.dark.palette.surface[l]);
      const lightMirror = hexToOklch(r.light.palette.surface[mirrorP - l]);
      assert.ok(Math.abs(dark.L - lightMirror.L) < 0.01, `paleta ${l}`);
      assert.ok(dark.C <= lightMirror.C + 0.005, `croma da paleta ${l}`);
    }
    for (const l of neutrals) {
      const dark = hexToOklch(r.dark.neutrals.surface[l]);
      // o espelho pode cair entre dois níveis (Aplica: 145 - 10 = 135); comparamos com a rampa teórica
      assert.ok(Math.abs(dark.L - neutralsLightness(mirrorN - l, preset)) < 0.02, `neutros ${l}`);
    }
  });

  test(`${presetId}: behavior aponta para níveis que existem na paleta`, () => {
    const r = decompose({ base: '#e7398a', preset: presetId });
    for (const [name, level] of Object.entries(preset.behavior)) {
      assert.equal(r.light.behavior.surface[name], r.light.palette.surface[level]);
      assert.equal(r.dark.behavior.txtOn[name], r.dark.palette.txtOn[level]);
      assert.equal(r.light.behavior.level[name], level);
    }
  });

  test(`${presetId}: a borda é a superfície do passo seguinte (e o último repete)`, () => {
    const r = decompose({ base: '#e7398a', preset: presetId });
    palette.forEach((l, i) => {
      assert.equal(r.light.palette.border[l], r.light.palette.surface[palette[Math.min(i + 1, palette.length - 1)]]);
    });
    neutrals.forEach((l, i) => {
      assert.equal(r.dark.neutrals.border[l], r.dark.neutrals.surface[neutrals[Math.min(i + 1, neutrals.length - 1)]]);
    });
  });

  test(`${presetId}: nenhuma combinação gera texto abaixo de 4,5:1 no AA`, () => {
    const strategies = [
      { txtOnStrategy: 'high-contrast' },
      { txtOnStrategy: 'brand-tint' },
      { txtOnStrategy: 'brand-tint', colorContrastDecompose: 'startLight' },
      { txtOnStrategy: 'custom-tint', txtOnCustomTint: { light: '#333333', dark: '#eeeeee', fallback: 'brand-tint' } }
    ];
    for (const options of strategies) {
      for (const hex of SAMPLE) {
        const r = decompose({ base: hex, preset: presetId, options });
        assert.deepEqual(r.warnings, []);
        for (const row of auditResult(r)) assert.ok(row.aa, `${hex} ${row.mode} ${row.group} ${row.level}: ${row.ratio.toFixed(2)}`);
      }
    }
  });
}

test('padrao: 9 níveis na paleta e nos neutros, espelho 200 e 140', () => {
  assert.equal(PRESETS.padrao.palette.levels.length, 9);
  assert.equal(PRESETS.padrao.neutrals.levels.length, 9);
  assert.equal(PRESETS.padrao.palette.levels[0] + PRESETS.padrao.palette.levels.at(-1), 200);
  assert.equal(PRESETS.padrao.neutrals.levels[0] + PRESETS.padrao.neutrals.levels.at(-1), 140);
});

test('aceita um preset próprio (dado, sem código)', () => {
  const mine = {
    ...PRESETS.aplica, id: 'tres',
    palette: { levels: [10, 100, 190], baseLevel: 100, step: 90, lightest: 0.98, darkest: 0.05 },
    neutrals: { levels: [5, 70, 140], referenceLevel: 70, chroma: 0.1, lightest: 0.98, darkest: 0.05 },
    behavior: { normal: 100 }, grayscale: null
  };
  const r = decompose({ base: '#e7398a', preset: mine });
  assert.deepEqual(Object.keys(r.light.palette.surface), ['10', '100', '190']);
  assert.equal(r.light.palette.border[10], r.light.palette.surface[100]);
});

test('preset inválido é recusado com mensagem clara', () => {
  assert.throws(() => resolvePreset('nao-existe'), /Preset desconhecido/);
  assert.throws(() => resolvePreset({ ...PRESETS.aplica, behavior: { x: 15 } }), /behavior\.x/);
  assert.throws(() => resolvePreset({ ...PRESETS.aplica, palette: { ...PRESETS.aplica.palette, baseLevel: 15 } }), /baseLevel/);
});

test('entradas inválidas', () => {
  assert.throws(() => decompose({ base: 'azul' }), /#RRGGBB/);
  assert.throws(() => decompose({ base: '#12345' }), /#RRGGBB/);
  assert.throws(() => decompose({ base: '#e7398a', options: { txtOnStrategy: 'x' } }), /txtOnStrategy/);
  assert.throws(() => decompose({ base: '#e7398a', options: { txtOnStrategy: 'custom-tint' } }), /txtOnCustomTint/);
  assert.throws(() => decompose({ base: '#e7398a', options: { accessibilityLevel: 'A' } }), /accessibilityLevel/);
  assert.throws(() => decompose({ base: '#e7398a', options: { colorContrastDecompose: 'x' } }), /colorContrastDecompose/);
  assert.throws(() => decompose({ base: '#e7398a', neutralsOverride: { light: { surface: { 7: '#fff000' } } } }), /nível 7/);
  assert.throws(() => decompose({ base: '#e7398a', neutralsOverride: { light: { baseColor: '#555555', referenceLevel: 7 } } }), /referenceLevel/);
});

test('hex é normalizado para minúsculas, com ou sem #', () => {
  assert.equal(decompose({ base: 'E7398A' }).base, '#e7398a');
});

test('custom-tint sem nenhuma cor avisa e usa o fallback', () => {
  const r = decompose({ base: '#e7398a', options: { txtOnStrategy: 'custom-tint', txtOnCustomTint: { fallback: 'high-contrast' } } });
  assert.equal(r.warnings[0].type, 'config');
});

test('custom-tint usa a cor própria quando ela passa e o fallback quando não passa', () => {
  const r = decompose({ base: '#e7398a', options: { txtOnStrategy: 'custom-tint', txtOnCustomTint: { light: '#222222', fallback: 'high-contrast' } } });
  assert.equal(r.light.palette.txtOn[10], '#222222');
  assert.equal(r.light.palette.txtOn[190], '#ffffff'); // #222 não passa no escuro
});

test('AAA: accept-aa registra o aviso e entrega texto de ao menos 4,5:1', () => {
  const r = decompose({ base: '#e7398a', options: { accessibilityLevel: 'AAA', onAccessibilityFailure: 'accept-aa' } });
  assert.ok(r.warnings.length > 0);
  for (const w of r.warnings) {
    assert.equal(w.accepted, 'AA');
    assert.ok(w.ratio >= 4.5 && w.ratio < 7);
  }
});

test('AAA: warn mantém o valor e avisa; throw interrompe', () => {
  const warn = decompose({ base: '#e7398a', options: { accessibilityLevel: 'AAA', onAccessibilityFailure: 'warn' } });
  assert.ok(warn.warnings.some((w) => w.accepted === null));
  assert.throws(() => decompose({ base: '#e7398a', options: { accessibilityLevel: 'AAA', onAccessibilityFailure: 'throw' } }), /AAA/);
});

test('texto informado à mão que falha só avisa (ou interrompe no modo throw)', () => {
  const ov = { light: { txtOn: { 5: '#eeeeee' } }, dark: null };
  const r = decompose({ base: '#e7398a', neutralsOverride: ov });
  assert.ok(r.warnings.some((w) => w.type === 'override' && w.level === 5));
  assert.equal(r.light.neutrals.txtOn[5], '#eeeeee');
  assert.throws(() => decompose({ base: '#e7398a', neutralsOverride: ov, options: { onAccessibilityFailure: 'throw' } }), /não atinge/);
});

test('borderOffset: paleta em níveis, neutros em passos; valores fora da grade viram o passo mais próximo', () => {
  const r = decompose({ base: '#e7398a', options: { borderOffset: { palette: 20, neutrals: 2 } } });
  assert.equal(r.light.palette.border[10], r.light.palette.surface[30]);
  assert.equal(r.light.neutrals.border[5], r.light.neutrals.surface[20]);
  const off = decompose({ base: '#e7398a', options: { borderOffset: { palette: 14 } } });
  assert.equal(off.light.palette.border[10], off.light.palette.surface[20]); // 14 → 1 passo (o oficial cairia no nível 190)
});

test('neutros com cor própria passam por ela no nível de referência', () => {
  const r = decompose({ base: '#e7398a', neutralsOverride: { light: { baseColor: '#5a6b7c', referenceLevel: 100 }, dark: null } });
  const L = hexToOklch(r.light.neutrals.surface[100]).L;
  assert.ok(Math.abs(L - hexToOklch('#5a6b7c').L) < 0.01);
});

test('bloco único de neutros vale para o light e o dark espelha as chaves', () => {
  const r = decompose({ base: '#e7398a', neutralsOverride: { surface: { 5: '#f6f3f5' }, txtOn: { 5: '#111111' } } });
  assert.equal(r.light.neutrals.surface[5], '#f6f3f5');
  assert.equal(r.dark.neutrals.surface[140], '#f6f3f5');
  assert.equal(r.dark.neutrals.txtOn[140], '#111111');
});

test('bloco único com baseColor mantém a cor própria também no dark', () => {
  const r = decompose({ base: '#e7398a', neutralsOverride: { baseColor: '#5a6b7c', surface: { 5: '#f6f3f5' } } });
  const hue = hexToOklch(r.dark.neutrals.surface[70]).h;
  assert.ok(Math.abs(hue - hexToOklch('#5a6b7c').h) < 8);
});

test('escala de cinzas: padrão do Aplica, espelho no dark e borda um passo mais clara', () => {
  const g = generateGrayscale();
  assert.equal(g.light.surface[5], '#f7f7f7');
  assert.equal(g.dark.surface[5], '#111111');
  assert.equal(g.dark.surface[140], '#f7f7f7');
  assert.equal(g.dark.txtOn[140], '#111111');
  assert.equal(g.dark.border[5], g.dark.surface[10]);
});

test('escala de cinzas: sobrescrita light/dark parte dos padrões já na orientação do dark', () => {
  const g = generateGrayscale({ overrides: { light: { surface: { 5: '#faf8f5' } }, dark: { surface: { 140: '#fdfaf5' } } } });
  assert.equal(g.light.surface[5], '#faf8f5');
  assert.equal(g.dark.surface[140], '#fdfaf5');
  assert.equal(g.dark.surface[5], '#111111'); // o resto continua espelhado (o oficial misturaria com a orientação do light)
});

test('escala de cinzas do preset padrao é uma rampa neutra legível', () => {
  const g = generateGrayscale({ preset: 'padrao' });
  assert.equal(Object.keys(g.light.surface).length, 9);
  for (const l of Object.keys(g.light.surface)) {
    assert.ok(contrastRatio(g.light.surface[l], g.light.txtOn[l]) >= 4.5);
  }
});

test('tema: avisos acumulam, cores independentes, formato de tokens do Aplica', () => {
  const t = decomposeTheme({ colors: { a: '#e7398a', b: '#38c2d0' }, options: { accessibilityLevel: 'AAA' } });
  assert.ok(t.warnings.every((w) => ['a', 'b'].length));
  const tokens = toPrimitiveTheme(t)._color_palette.mode.dark.b.behavior.surface.lightest;
  assert.deepEqual(Object.keys(tokens), ['$type', '$value']);
  assert.throws(() => decomposeTheme({ colors: {} }), /ao menos uma cor/);
});

test('exportação: variáveis CSS com claro em :root e escuro em [data-theme="dark"]', async () => {
  const { toCssVariables, toPlainJson } = await import('../src/index.js');
  const t = decomposeTheme({ colors: { 'Minha Marca': '#e7398a' }, options: { generateTxt: true } });
  const css = toCssVariables(t);
  assert.match(css, /:root, \[data-theme="light"\] \{/);
  assert.match(css, /\[data-theme="dark"\] \{/);
  assert.match(css, /--minha-marca-palette-surface-100: #e7398a;/);
  assert.match(css, /--minha-marca-behavior-surface-normal: #e7398a;/);
  assert.match(css, /--minha-marca-palette-txt-10: #/);
  assert.match(css, /--grayscale-surface-5: #f7f7f7;/);
  assert.equal(JSON.parse(toPlainJson(t)).preset, 'aplica');
});
