import test from 'node:test';
import assert from 'node:assert/strict';
import { decompose, hexToOklch, maxChroma, vividGain, VIVID_VISIBLE_LIMIT, VIVID_RATIO } from '../src/index.js';

const palette = (base, preset, options = {}, mode = 'light') =>
  decompose({ base, preset, options })[mode].palette.surface;

for (const preset of ['aplica', 'standard']) {
  test(`${preset}: sem vividChroma o resultado é idêntico`, () => {
    for (const base of ['#FCFBF2', '#E7398A', '#336699']) {
      assert.deepEqual(palette(base, preset, { vividChroma: false }), palette(base, preset));
    }
  });

  test(`${preset}: com vividChroma a cor digitada fica exata e nenhum tom perde intensidade`, () => {
    const base = '#FCFBF2';
    const normal = palette(base, preset);
    const vivid = palette(base, preset, { vividChroma: true, brandLevel: preset === 'aplica' ? 10 : 20 });
    const at = preset === 'aplica' ? 10 : 20;
    assert.equal(vivid[at], base.toLowerCase());
    for (const level of Object.keys(vivid)) {
      if (Number(level) === at) continue;
      assert.ok(hexToOklch(vivid[level]).C >= hexToOklch(normal[level]).C - 0.002, `tom ${level}`);
    }
  });

  test(`${preset}: tons com cor viva ficam dentro do sRGB`, () => {
    for (const mode of ['light', 'dark']) {
      const vivid = palette('#FCFBF2', preset, { vividChroma: true }, mode);
      for (const hex of Object.values(vivid)) assert.match(hex, /^#[0-9a-f]{6}$/);
    }
  });
}

test('cor viva: o croma dos tons chega perto da fração do máximo do matiz no nível 100', () => {
  const vivid = palette('#FCFBF2', 'standard', { vividChroma: true, brandLevel: 20 });
  const { h } = hexToOklch('#FCFBF2');
  for (const level of [100, 120, 140]) {
    const tone = hexToOklch(vivid[level]);
    const limit = maxChroma(tone.L, h) * VIVID_RATIO;
    assert.ok(Math.abs(tone.C - limit) < 0.01, `nível ${level}: ${tone.C} x ${limit}`);
  }
});

test('cor viva: a intensidade sobe aos poucos a partir da cor base até o nível 100', () => {
  const vivid = palette('#FCFBF2', 'standard', { vividChroma: true, brandLevel: 20 });
  const { h } = hexToOklch('#FCFBF2');
  const share = (level) => { const t = hexToOklch(vivid[level]); return t.C / (maxChroma(t.L, h) * VIVID_RATIO); };
  assert.ok(share(40) < share(60) && share(60) < share(80) && share(80) < share(100));
  assert.ok(share(40) < 0.5, `o 40 já está em ${share(40)} do máximo`);
});

test('cor viva: cinza puro não muda', () => {
  assert.deepEqual(palette('#808080', 'standard', { vividChroma: true }), palette('#808080', 'standard'));
  assert.equal(vividGain('#808080', 'standard', 100), 0);
});

test('cor viva: só aparece para cores de pouca intensidade', () => {
  assert.ok(vividGain('#FCFBF2', 'standard', 20) > VIVID_VISIBLE_LIMIT);
  assert.ok(vividGain('#8A8F98', 'standard', 80) > VIVID_VISIBLE_LIMIT);
  for (const intense of ['#F5B700', '#E7398A', '#2563EB', '#16A34A']) {
    assert.ok(vividGain(intense, 'standard', 80) < VIVID_VISIBLE_LIMIT, intense);
  }
});
