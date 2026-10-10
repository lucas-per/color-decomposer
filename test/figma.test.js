import test from 'node:test';
import assert from 'node:assert/strict';
import { decomposeTheme, toFigmaVariables, toFigmaJson, FIGMA_FORMAT } from '../src/index.js';

const theme = (extra = {}) => decomposeTheme({ colors: { marca: '#E7398A', apoio: '#2457C5' }, options: { generateTxt: true }, ...extra });

test('figma: duas coleções, cada uma com os modos Claro e Escuro', () => {
  const f = toFigmaVariables(theme());
  assert.equal(f.format, FIGMA_FORMAT);
  assert.deepEqual(f.modes, ['Claro', 'Escuro']);
  assert.deepEqual(f.collections.map((c) => c.name), ['Primitivos', 'Semântica']);
});

test('figma: primitivos trazem o valor de cada modo, igual ao resultado do motor', () => {
  const t = theme();
  const f = toFigmaVariables(t);
  const prim = new Map(f.collections[0].variables.map((v) => [v.name, v.values]));
  assert.equal(prim.get('marca/palette/surface/100').Claro, t.colors.marca.light.palette.surface[100]);
  assert.equal(prim.get('marca/palette/surface/100').Escuro, t.colors.marca.dark.palette.surface[100]);
  assert.equal(prim.get('apoio/neutrals/border/60').Escuro, t.colors.apoio.dark.neutrals.border[60]);
  assert.equal(prim.get('grayscale/surface/5').Claro, t.grayscale.light.surface[5]);
  // 2 cores × (19 + 15 níveis) × 4 escalas + 15 cinzas × 4 escalas
  assert.equal(prim.size, 2 * 34 * 4 + 15 * 4);
  for (const v of prim.values()) for (const hex of Object.values(v)) assert.match(hex, /^#[0-9a-f]{6}$/);
});

test('figma: comportamento é semântico e aponta, em cada modo, para um primitivo que existe', () => {
  const t = theme();
  const f = toFigmaVariables(t);
  const prim = new Map(f.collections[0].variables.map((v) => [v.name, v.values]));
  assert.equal(f.collections[1].variables.length, 2 * 6 * 4);
  for (const v of f.collections[1].variables) {
    assert.equal(v.values, undefined);
    for (const mode of ['Claro', 'Escuro']) assert.ok(prim.has(v.aliases[mode]), `${v.name} → ${v.aliases[mode]}`);
  }
  // o valor final do alias é o do comportamento gerado pelo motor, nos dois modos
  const get = (name) => f.collections[1].variables.find((v) => v.name === name);
  for (const [mode, key] of [['Claro', 'light'], ['Escuro', 'dark']]) {
    for (const state of Object.keys(t.colors.marca.light.behavior.surface)) {
      for (const scale of ['surface', 'txtOn', 'border', 'txt']) {
        const target = get(`marca/behavior/${state}/${scale}`).aliases[mode];
        assert.equal(prim.get(target)[mode], t.colors.marca[key].behavior[scale][state], `${state}/${scale}/${mode}`);
      }
    }
  }
});

test('figma: as amostras só usam variables que existem', () => {
  const f = toFigmaVariables(theme());
  const names = new Set(f.collections.flatMap((c) => c.variables.map((v) => v.name)));
  assert.ok(names.has(f.canvas.fill) && names.has(f.canvas.text));
  assert.deepEqual(f.samples.map((s) => s.title), ['marca: paleta', 'marca: neutros', 'marca: comportamento', 'apoio: paleta', 'apoio: neutros', 'apoio: comportamento', 'Cinzas']);
  for (const s of f.samples) for (const i of s.items) for (const k of ['surface', 'txtOn', 'border']) assert.ok(names.has(i[k]), i[k]);
});

test('figma: toda variable diz o tipo (scale), para o plugin limitar onde ela aparece', () => {
  const f = toFigmaVariables(theme());
  for (const c of f.collections) for (const v of c.variables) assert.ok(['surface', 'txtOn', 'border', 'txt'].includes(v.scale), v.name);
  const v = f.collections[0].variables.find((x) => x.name === 'marca/neutrals/border/60');
  assert.equal(v.scale, 'border');
});

test('figma: sem o token txt, nada de txt; nomes com barra não quebram os grupos', () => {
  const t = decomposeTheme({ colors: { 'a/b': '#336699' } });
  const f = toFigmaVariables(t);
  const names = f.collections.flatMap((c) => c.variables.map((v) => v.name));
  assert.ok(!names.some((n) => n.endsWith('/txt/10') || n.includes('/txt/')));
  assert.ok(names.every((n) => !n.startsWith('a/b/')));
  assert.ok(names.includes('a-b/palette/surface/100'));
});

test('figma: funciona com o preset custom (Padrão) e vira JSON válido', () => {
  const t = decomposeTheme({ colors: { marca: '#E7398A' }, preset: 'custom' });
  const f = JSON.parse(toFigmaJson(t));
  assert.equal(f.collections[0].variables.filter((v) => v.name.startsWith('marca/palette/surface/')).length, 9);
  assert.equal(f.collections[1].variables.length, 6 * 3);
});
