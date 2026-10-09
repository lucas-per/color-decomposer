import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFromFixture, diffTokens, readJson } from './helpers.js';

// Temas reais do aplica-tokens-themes-sample (MIT). Joy usa brand-tint + AAA; Blue Sky usa
// high-contrast + AA e sobrescreve os neutros da cor principal.
//
// O token `txt` fica de fora: os arquivos de exemplo foram gerados pelo engine ^3.6, e a regra do
// `txt` mudou até a 3.23.4 (a que seguimos). Ele é coberto em txt.test.js.
const THEMES = ['aplica_joy', 'aplica_blue_sky'];
const withoutTxt = (d) => !/\.txt\./.test(d);

for (const dir of THEMES) {
  test(`${dir}: paleta, neutros e behavior idênticos ao tema oficial`, () => {
    const { primitive } = buildFromFixture(dir);
    const expected = readJson('fixtures', dir, '_primitive_theme.json');
    assert.deepEqual(diffTokens(primitive, expected).filter(withoutTxt), []);
  });

  test(`${dir}: escala de cinzas idêntica à oficial`, () => {
    const { grayscale } = buildFromFixture(dir);
    const expected = readJson('fixtures', dir, '_grayscale.json');
    assert.deepEqual(diffTokens(grayscale, expected).filter(withoutTxt), []);
  });
}
