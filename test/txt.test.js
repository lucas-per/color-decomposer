import test from 'node:test';
import assert from 'node:assert/strict';
import { decomposeTheme, contrastRatio } from '../src/index.js';
import { buildFromFixture } from './helpers.js';

// O `txt` segue o gerador de tema 3.23.4: um valor por escala, vindo da própria escala,
// validado contra os neutros da primeira cor no primeiro nível.
for (const dir of ['aplica_joy', 'aplica_blue_sky']) {
  test(`${dir}: txt passa no contraste exigido contra o fundo ambiente, em todas as escalas`, () => {
    const { cfg, theme } = buildFromFixture(dir);
    const required = cfg.options.accessibilityLevel === 'AAA' ? 7 : 4.5;
    const first = Object.keys(cfg.colors)[0];
    for (const mode of ['light', 'dark']) {
      const bg = theme.colors[first][mode].neutrals.surface[5];
      const scales = [theme.grayscale[mode].txt];
      for (const c of Object.values(theme.colors)) scales.push(c[mode].palette.txt, c[mode].neutrals.txt);
      for (const scale of scales) {
        const values = new Set(Object.values(scale));
        assert.equal(values.size, 1, 'um único valor por escala');
        const [v] = values;
        assert.ok(contrastRatio(bg, v) >= required || /^#(000000|ffffff)$/.test(v));
      }
    }
  });
}

test('txt: behavior repete o txt do nível de paleta correspondente', () => {
  const t = decomposeTheme({ colors: { a: '#e7398a' }, options: { generateTxt: true } });
  const c = t.colors.a.light;
  assert.equal(c.behavior.txt.normal, c.palette.txt[100]);
});

test('txt: a busca começa no nível de referência (padrão 140) e segue para o lado do texto preferido', () => {
  const t = decomposeTheme({ colors: { a: '#e7398a' }, options: { generateTxt: true } });
  assert.equal(t.colors.a.light.palette.txt[10], t.colors.a.light.palette.surface[140]); // fundo claro → texto escuro
  const t2 = decomposeTheme({ colors: { a: '#e7398a' }, options: { generateTxt: true, txtBaseColorLevel: 170 } });
  assert.equal(t2.colors.a.light.palette.txt[10], t2.colors.a.light.palette.surface[170]);
});

test('txt: ambient escolhe outra cor e outro nível como fundo', () => {
  const colors = { a: '#e7398a', b: '#013fc4' };
  const base = decomposeTheme({ colors, options: { generateTxt: true } });
  const other = decomposeTheme({ colors, options: { generateTxt: true }, ambient: { color: 'b', level: 140 } });
  assert.notEqual(base.colors.a.dark.palette.txt[10], other.colors.a.dark.palette.txt[10]);
  assert.throws(() => decomposeTheme({ colors, options: { generateTxt: true }, ambient: { color: 'zzz' } }), /ambient\.color/);
  assert.throws(() => decomposeTheme({ colors, options: { generateTxt: true }, ambient: { level: 7 } }), /ambient\.level/);
});
