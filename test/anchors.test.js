import test from 'node:test';
import assert from 'node:assert/strict';
import { decompose, suggestBrandLevel, hexToOklch, PRESETS } from '../src/index.js';

const MAIN = '#ffd23f', SUPPORT = '#fcfbf2';
const run = (extra = {}, preset = 'aplica') =>
  decompose({ base: MAIN, preset, options: { anchors: [{ hex: SUPPORT }], ...extra } });
const L = (hex) => hexToOklch(hex).L;
const sorted = (surface) => Object.keys(surface).map(Number).sort((a, b) => a - b);

test('sem anchors, ou com anchors vazio, o resultado é o de sempre', () => {
  const a = decompose({ base: MAIN });
  assert.deepEqual(decompose({ base: MAIN, options: { anchors: [] } }).light, a.light);
  assert.deepEqual(decompose({ base: MAIN, options: { anchors: [] } }).dark, a.dark);
});

test('a cor principal fica no 100 e a de apoio no nível de claridade mais próxima, ambas exatas', () => {
  for (const preset of ['aplica', 'standard']) {
    const r = run({}, preset);
    const lvl = suggestBrandLevel(SUPPORT, preset);
    assert.equal(r.warnings.length, 0);
    assert.equal(r.light.palette.surface[100], MAIN);
    assert.equal(r.light.palette.surface[lvl], SUPPORT);
    const { levels } = PRESETS[preset].palette;
    const sum = levels[0] + levels.at(-1);
    assert.equal(r.dark.palette.surface[sum - 100], MAIN);
    assert.equal(r.dark.palette.surface[sum - lvl], SUPPORT);
  }
});

test('a claridade nunca sobe quando o nível sobe, e todos os tons são hex válidos', () => {
  for (const [main, support] of [[MAIN, SUPPORT], ['#1e3a8a', '#dbeafe'], ['#e7398a', '#fff0f6']]) {
    for (const preset of ['aplica', 'standard']) {
      const r = decompose({ base: main, preset, options: { anchors: [{ hex: support }] } });
      const s = r.light.palette.surface;
      const lv = sorted(s);
      for (let i = 1; i < lv.length; i++) assert.ok(L(s[lv[i]]) <= L(s[lv[i - 1]]) + 0.004, `${main} ${preset} nível ${lv[i]}`);
      for (const v of Object.values(r.dark.palette.surface)) assert.match(v, /^#[0-9a-f]{6}$/);
    }
  }
});

test('o matiz dos tons escuros vem da cor principal, não do off-white', () => {
  const r = run();
  const dark = hexToOklch(r.light.palette.surface[160]);
  const main = hexToOklch(MAIN).h; // 91°
  assert.ok(Math.abs(dark.h - main) < 3, `matiz ${dark.h} deveria ficar perto de ${main}`);
  assert.ok(Math.abs(dark.h - hexToOklch(SUPPORT).h) > 5, 'não herda o matiz do off-white (101°)');
  assert.ok(dark.C > 0.05, 'tons escuros mantêm intensidade, não ficam oliva apagados');
});

test('dois níveis iguais avisam e usam só a cor principal', () => {
  const r = decompose({ base: MAIN, options: { anchors: [{ hex: '#ffd240', level: 100 }] } });
  assert.equal(r.warnings.length, 1);
  assert.equal(r.warnings[0].type, 'anchors');
  assert.equal(r.warnings[0].reason, 'same-level');
  assert.deepEqual(r.light.palette, decompose({ base: MAIN }).light.palette);
});

test('cor de apoio que faria a claridade subir é ignorada com aviso', () => {
  // O nível 20 vai para o off-white, mas informar um nível mais escuro que a principal numa cor clara quebra a ordem.
  const r = decompose({ base: SUPPORT, options: { anchors: [{ hex: '#ffffff', level: 150 }] } });
  assert.ok(r.warnings.some((w) => w.type === 'anchors' && w.reason === 'order'));
  assert.deepEqual(r.light.palette, decompose({ base: SUPPORT }).light.palette);
});

test('o nível pode ser informado à mão e precisa existir', () => {
  const r = decompose({ base: '#1e3a8a', options: { anchors: [{ hex: '#dbeafe', level: 40 }] } });
  assert.equal(r.light.palette.surface[40], '#dbeafe');
  assert.throws(() => decompose({ base: MAIN, options: { anchors: [{ hex: SUPPORT, level: 45 }] } }), /não existe/);
  assert.throws(() => decompose({ base: MAIN, options: { anchors: 'x' } }), /lista/);
});

test('neutros e estados de comportamento vêm da cor principal', () => {
  const a = decompose({ base: MAIN });
  const b = run();
  assert.deepEqual(b.light.neutrals.surface, a.light.neutrals.surface);
  assert.deepEqual(b.light.behavior.level, a.light.behavior.level);
});

test('as cores de apoio não alteram o Aplica sem extensões (golden/oráculo seguem passando)', () => {
  const a = decompose({ base: '#336699' });
  const b = decompose({ base: '#336699', options: {} });
  assert.deepEqual(a, b);
});

test('sem nível informado, a cor de apoio vai para o lado certo da principal', async () => {
  const { supportLevel } = await import('../src/index.js');
  for (const preset of ['aplica', 'standard']) {
    const p = PRESETS[preset];
    // principal clara (amarelo) com apoio de claridade média: mais escura que a principal, então depois do 100
    assert.ok(supportLevel('#ffd23f', '#808080', p) > 100);
    assert.ok(supportLevel('#ffd23f', '#6b7280', p) > 100);
    // principal escura com apoio mais claro: antes do 100
    assert.ok(supportLevel('#1e3a8a', '#4a6ac0', p) < 100);
    // fora da faixa de conflito, continua o nível de claridade mais próxima
    assert.equal(supportLevel('#ffd23f', '#fcfbf2', p), suggestBrandLevel('#fcfbf2', preset));
    for (const [m, s] of [['#ffd23f', '#808080'], ['#1e3a8a', '#4a6ac0'], ['#e7398a', '#fff0f6'], ['#e7398a', '#7a1d4a']]) {
      const r = decompose({ base: m, preset, options: { anchors: [{ hex: s }] } });
      assert.equal(r.warnings.length, 0, `${m} + ${s} (${preset})`);
    }
  }
});

test('entre a cor de apoio e a principal, os passos de claridade e cor são iguais', async () => {
  const { deltaEOk } = await import('../src/index.js');
  const s = run({}, 'standard').light.palette.surface;
  const steps = [20, 40, 60, 80].map((l) => deltaEOk(s[l], s[l + 20]));
  const min = Math.min(...steps), max = Math.max(...steps);
  assert.ok(max / min < 1.1, `passos ${steps.map((x) => x.toFixed(3)).join(' ')} deveriam ser iguais`);
});

test('Padrão: o tom mais escuro não vira quase preto e mantém o matiz da cor', () => {
  const s = decompose({ base: MAIN, preset: 'standard' }).light.palette.surface;
  const last = hexToOklch(s[180]);
  assert.ok(last.L > 0.18 && last.L < 0.25, `claridade ${last.L}`);
  assert.ok(Math.abs(last.h - hexToOklch(MAIN).h) < 12, `matiz ${last.h}`);
  // o Aplica continua com a regra dele
  assert.ok(hexToOklch(decompose({ base: MAIN, preset: 'aplica' }).light.palette.surface[190]).L < 0.1);
});

test('Padrão: o texto usa #242121 e #FDFDFD e, quando nenhum passa, a cor mais próxima que passa no AA', async () => {
  const { contrastRatio, deltaEOk } = await import('../src/index.js');
  let adjusted = 0;
  for (const color of ['#ffd23f', '#e7398a', '#1e3a8a', '#22c55e', '#808080', '#ef4444', '#7c3aed', '#6b7280']) {
    const r = decompose({ base: color, preset: 'standard' });
    for (const mode of ['light', 'dark']) {
      for (const group of ['palette', 'neutrals']) {
        const { surface, txtOn } = r[mode][group];
        for (const level of Object.keys(surface)) {
          assert.ok(contrastRatio(surface[level], txtOn[level]) >= 4.5, `${color} ${mode} ${group} ${level}`);
          if (!['#242121', '#fdfdfd'].includes(txtOn[level])) {
            adjusted++;
            const fromDark = deltaEOk('#242121', txtOn[level]), fromLight = deltaEOk('#fdfdfd', txtOn[level]);
            assert.ok(Math.min(fromDark, fromLight) < 0.2, `${txtOn[level]} deveria ficar perto de #242121 ou #FDFDFD`);
          }
        }
      }
    }
  }
  assert.ok(adjusted > 0, 'o teste deveria exercitar o ajuste');
  const { surface, txtOn } = decompose({ base: '#e7398a', preset: 'standard' }).light.palette;
  assert.ok(contrastRatio(surface[100], '#242121') < 4.5 && contrastRatio(surface[100], '#fdfdfd') < 4.5, 'a marca rosa não passa com nenhuma das duas');
  assert.ok(contrastRatio(surface[100], txtOn[100]) >= 4.5 && txtOn[100] !== '#000000');
  assert.ok(decompose({ base: '#ffd23f', preset: 'standard' }).light.palette.txtOn[20] === '#242121');
  assert.ok(decompose({ base: '#ffd23f', preset: 'aplica' }).light.palette.txtOn[10] === '#000000');
});

test('Padrão: um azul muito claro continua azul quase branco, sem virar ciano', () => {
  const s = decompose({ base: '#057abd', preset: 'standard' }).light.palette.surface;
  const first = hexToOklch(s[20]);
  assert.ok(first.L > 0.97, `claridade ${first.L}`);
  assert.ok(Math.abs(first.h - hexToOklch('#057abd').h) < 8, `matiz ${first.h}`);
  // o Aplica segue o corte por canal dele
  assert.ok(hexToOklch(decompose({ base: '#057abd', preset: 'aplica' }).light.palette.surface[10]).h < 215);
});
