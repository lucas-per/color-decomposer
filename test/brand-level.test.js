import test from 'node:test';
import assert from 'node:assert/strict';
import { decomposeTheme, decompose, checkToneSeparation, suggestBrandLevel, toFigmaVariables, PRESETS } from '../src/index.js';

const palette = (color, preset, brandLevel, mode = 'light') =>
  decomposeTheme({ colors: { c: color }, preset, options: brandLevel ? { brandLevel } : {} }).colors.c[mode].palette.surface;

test('sem brandLevel o resultado é o mesmo de antes (marca no 100)', () => {
  const a = decompose({ base: '#ffd23f' });
  const b = decompose({ base: '#ffd23f', options: { brandLevel: 100 } });
  assert.deepEqual(a.light.palette, b.light.palette);
  assert.deepEqual(a.dark.palette, b.dark.palette);
  assert.equal(a.light.palette.surface[100], '#ffd23f');
});

test('brandLevel põe a marca exata nesse nível no claro e no nível espelhado no escuro', () => {
  const r = decompose({ base: '#f5b700', options: { brandLevel: 40 } });
  assert.equal(r.light.palette.surface[40], '#f5b700');
  assert.equal(r.dark.palette.surface[160], '#f5b700'); // 190 + 10 - 40
});

test('a escala continua do mais claro ao mais escuro passando pela marca', () => {
  const s = palette('#f5b700', 'aplica', 40);
  const Ls = Object.keys(s).map(Number).sort((a, b) => a - b).map((l) => parseInt(s[l].slice(1, 3), 16) * 0.3 + parseInt(s[l].slice(3, 5), 16) * 0.59 + parseInt(s[l].slice(5, 7), 16) * 0.11);
  for (let i = 1; i < Ls.length; i++) assert.ok(Ls[i] <= Ls[i - 1] + 1, `nível ${i} deveria ser mais escuro ou igual ao anterior`);
});

test('brandLevel fora da paleta dá erro claro', () => {
  assert.throws(() => decompose({ base: '#336699', options: { brandLevel: 45 } }), /brandLevel inválido/);
  assert.throws(() => decompose({ base: '#336699', preset: 'standard', options: { brandLevel: 10 } }), /brandLevel inválido/);
});

test('suggestBrandLevel: claras vão para níveis baixos, escuras para altos, e o resultado é um nível da paleta', () => {
  assert.equal(suggestBrandLevel('#f5b700'), 40);
  assert.equal(suggestBrandLevel('#ffd23f'), 30);
  assert.ok(suggestBrandLevel('#1e3a8a') > 100);
  for (const preset of ['aplica', 'standard']) {
    for (const c of ['#ffffff', '#000000', '#e7398a', '#fde68a']) {
      assert.ok(PRESETS[preset].palette.levels.includes(suggestBrandLevel(c, preset)));
    }
  }
});

test('o Auto resolve os tons parecidos em marcas claras e escuras, nos dois presets e nos dois modos', () => {
  for (const preset of ['aplica', 'standard']) {
    for (const color of ['#ffd23f', '#f5b700', '#d4e157', '#22d3ee', '#fde68a', '#0a0a14', '#111827']) {
      const level = suggestBrandLevel(color, preset);
      for (const mode of ['light', 'dark']) {
        const r = checkToneSeparation(palette(color, preset, level, mode), color);
        assert.equal(r.runs.length, 0, `${color} (${preset}, ${mode}) no nível ${level} ainda tem tons parecidos`);
      }
    }
  }
});

const behaviorOf = (color, preset, options, mode = 'light') =>
  decompose({ base: color, preset, options })[mode].behavior;

test('behaviorFollowsBrand desligado: os estados continuam nos níveis do preset (normal no 100)', () => {
  const b = behaviorOf('#f5b700', 'aplica', { brandLevel: 40 });
  assert.deepEqual(b.level, PRESETS.aplica.behavior);
});

test('behaviorFollowsBrand com a marca no 100 não muda nada', () => {
  const a = behaviorOf('#336699', 'aplica', {});
  const b = behaviorOf('#336699', 'aplica', { behaviorFollowsBrand: true });
  assert.deepEqual(a, b);
});

test('behaviorFollowsBrand: o normal é a marca e os estados mantêm a ordem, no claro e no escuro', () => {
  for (const preset of ['aplica', 'standard']) {
    const { levels } = PRESETS[preset].palette;
    const sum = levels[0] + levels.at(-1);
    for (const brandLevel of levels) {
      const options = { brandLevel, behaviorFollowsBrand: true };
      const light = behaviorOf('#f5b700', preset, options, 'light');
      const dark = behaviorOf('#f5b700', preset, options, 'dark');
      assert.equal(light.level.normal, brandLevel);
      assert.equal(dark.level.normal, sum - brandLevel);
      assert.equal(light.surface.normal, '#f5b700');
      assert.equal(dark.surface.normal, '#f5b700');
      for (const b of [light, dark]) {
        const order = Object.keys(PRESETS[preset].behavior).map((n) => b.level[n]);
        const orig = Object.values(PRESETS[preset].behavior);
        for (let i = 1; i < order.length; i++) {
          assert.ok(orig[i] > orig[i - 1] ? order[i] >= order[i - 1] : true, `ordem quebrada (${preset}, marca ${brandLevel})`);
          assert.ok(levels.includes(order[i]));
        }
      }
    }
  }
});

test('behaviorFollowsBrand com a marca no 40 (Aplica): níveis esperados', () => {
  const light = behaviorOf('#f5b700', 'aplica', { brandLevel: 40, behaviorFollowsBrand: true }, 'light').level;
  assert.deepEqual(light, { lightest: 10, active: 20, normal: 40, action: 70, pressed: 110, darkest: 160 });
  const dark = behaviorOf('#f5b700', 'aplica', { brandLevel: 40, behaviorFollowsBrand: true }, 'dark').level;
  assert.deepEqual(dark, { lightest: 10, active: 80, normal: 160, action: 170, pressed: 180, darkest: 190 });
});

test('níveis distintos quando há espaço', () => {
  const l = behaviorOf('#f5b700', 'aplica', { brandLevel: 40, behaviorFollowsBrand: true }).level;
  assert.equal(new Set(Object.values(l)).size, Object.keys(l).length);
});

test('as variables do Figma apontam o normal para o nível da marca em cada modo', () => {
  const theme = decomposeTheme({ colors: { c: '#f5b700' }, options: { brandLevel: 40, behaviorFollowsBrand: true } });
  const fig = toFigmaVariables(theme);
  const v = fig.collections.find((c) => c.name === 'Semântica').variables.find((x) => x.name === 'c/behavior/normal/surface');
  assert.equal(v.aliases.Claro, 'c/palette/surface/40');
  assert.equal(v.aliases.Escuro, 'c/palette/surface/160');
});
