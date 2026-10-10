import test from 'node:test';
import assert from 'node:assert/strict';
import { decomposeTheme, checkToneSeparation, SEPARATION_LIMIT, deltaEOk, oklchToHex, hexToOklch, maxChroma } from '../src/index.js';

const paletteOf = (color, preset = 'aplica', mode = 'light') =>
  decomposeTheme({ colors: { c: color }, preset }).colors.c[mode].palette.surface;

test('ΔE OK: igual é 0 e preto contra branco é 1', () => {
  assert.equal(deltaEOk('#336699', '#336699'), 0);
  assert.ok(Math.abs(deltaEOk('#000000', '#ffffff') - 1) < 0.01);
});

test('marcas muito claras ficam com tons colados, nos dois presets', () => {
  for (const preset of ['aplica', 'custom']) {
    for (const color of ['#ffd23f', '#d4e157', '#22d3ee', '#fde68a']) {
      const r = checkToneSeparation(paletteOf(color, preset), color);
      assert.ok(r.runs.length > 0, `${color} (${preset}) devia ter tons colados`);
    }
  }
});

test('o âmbar #f5b700 fica com tons colados no Aplica (19 tons)', () => {
  const r = checkToneSeparation(paletteOf('#f5b700'), '#f5b700');
  assert.ok(r.runs.length > 0);
});

test('marcas de claridade média ficam bem separadas, nos dois presets', () => {
  for (const preset of ['aplica', 'custom']) {
    for (const color of ['#e7398a', '#2563eb', '#16a34a', '#7c3aed', '#dc2626', '#ff8a00']) {
      const r = checkToneSeparation(paletteOf(color, preset), color);
      assert.equal(r.runs.length, 0, `${color} (${preset}) não devia ter tons colados`);
    }
  }
});

test('o lado do problema aponta se os tons colados são mais claros ou mais escuros que a marca', () => {
  const y = checkToneSeparation(paletteOf('#ffd23f'), '#ffd23f');
  assert.ok(y.runs.some((r) => r.side === 'lighter'));
  const k = checkToneSeparation(paletteOf('#0a0a14'), '#0a0a14');
  assert.ok(k.runs.some((r) => r.side === 'darker'));
});

test('trechos seguidos viram uma faixa só e a contagem de tons bate', () => {
  const r = checkToneSeparation(paletteOf('#ffd23f'), '#ffd23f');
  for (const run of r.runs) assert.ok(run.to > run.from);
  assert.equal(r.tones.length, new Set(r.pairs.flatMap((p) => [p.from, p.to])).size);
  assert.ok(r.tones.length < r.total);
  assert.equal(r.limit, SEPARATION_LIMIT);
});

test('o modo escuro também é avaliado', () => {
  const r = checkToneSeparation(paletteOf('#ffd23f', 'aplica', 'dark'), '#ffd23f');
  assert.ok(r.runs.length > 0);
});

test('oklchToHex: dentro do sRGB mantém a claridade; fora, reduz o croma e avisa', () => {
  const ok = oklchToHex(0.6, 0.1, 250);
  assert.equal(ok.clipped, false);
  assert.ok(Math.abs(hexToOklch(ok.hex).L - 0.6) < 0.01);
  const out = oklchToHex(0.9, 0.35, 250);
  assert.equal(out.clipped, true);
  assert.ok(out.chroma < 0.35 && out.chroma <= maxChroma(0.9, 250) + 1e-9);
  assert.ok(Math.abs(hexToOklch(out.hex).L - 0.9) < 0.02);
});
