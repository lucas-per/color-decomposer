// Presets de escala. Tudo que muda de um design system para outro mora aqui, como dado.
//
// Regras gerais (valem para qualquer preset):
//   - o primeiro nível é o mais claro (L = lightest) e o último o mais escuro (L = darkest);
//   - na paleta, o nível `baseLevel` é a cor da marca, exatamente como foi informada;
//   - no dark, a escala é gerada direto com o nível espelhado (primeiro + último - nível).
//     Para o Aplica isso dá 200 - nível na paleta e 145 - nível nos neutros.

const range = (from, to, step) => {
  const out = [];
  for (let n = from; n <= to; n += step) out.push(n);
  return out;
};

// Escala de cinzas fixa do Aplica (não é calculada, vem do tema).
const GRAYSCALE_SURFACE = {
  5: '#f7f7f7', 10: '#eeeeee', 20: '#dddddd', 30: '#cccccc', 40: '#bbbbbb',
  50: '#aaaaaa', 60: '#999999', 70: '#888888', 80: '#777777', 90: '#666666',
  100: '#555555', 110: '#444444', 120: '#333333', 130: '#222222', 140: '#111111'
};
const GRAYSCALE_TXON = {
  5: '#111111', 10: '#111111', 20: '#111111', 30: '#111111', 40: '#111111',
  50: '#111111', 60: '#111111', 70: '#111111', 80: '#000000', 90: '#ffffff',
  100: '#f7f7f7', 110: '#f7f7f7', 120: '#f7f7f7', 130: '#f7f7f7', 140: '#f7f7f7'
};
const GRAYSCALE_BORDER = {
  5: '#eeeeee', 10: '#dddddd', 20: '#cccccc', 30: '#bbbbbb', 40: '#aaaaaa',
  50: '#999999', 60: '#888888', 70: '#777777', 80: '#666666', 90: '#555555',
  100: '#444444', 110: '#333333', 120: '#222222', 130: '#111111', 140: '#000000'
};

export const APLICA = Object.freeze({
  id: 'aplica',
  label: 'Aplica',
  palette: {
    levels: range(10, 190, 10),
    baseLevel: 100,
    step: 10, // distância entre níveis; o deslocamento de borda é dado em unidades de nível
    lightest: 0.98,
    darkest: 0.05
  },
  neutrals: {
    levels: [5, ...range(10, 140, 10)],
    referenceLevel: 100,
    chroma: 0.1,
    lightest: 0.98,
    darkest: 0.05
  },
  behavior: { lightest: 10, active: 50, normal: 100, action: 120, pressed: 140, darkest: 170 },
  grayscale: { surface: GRAYSCALE_SURFACE, txtOn: GRAYSCALE_TXON, border: GRAYSCALE_BORDER }
});

// Escala enxuta de 9 níveis para o UaiUI. Não existe no Aplica: segue as mesmas regras
// (primeiro mais claro, 100 = marca, espelho = primeiro + último - nível).
export const STANDARD = Object.freeze({
  id: 'standard',
  label: 'Padrão (9 níveis)',
  // "Preto" e "branco" do texto no Padrão (usados também no cálculo de contraste). Se nenhum dos dois alcança o contraste
  // pedido numa superfície, o texto usa a cor mais próxima deles que alcança (escurecida ou clareada o mínimo).
  ink: Object.freeze({ dark: '#242121', light: '#fdfdfd' }),
  gamutMap: 'full', // tons que não cabem no sRGB perdem intensidade e mantêm o matiz (o Aplica corta por canal e o matiz foge)
  palette: {
    levels: range(20, 180, 20),
    baseLevel: 100,
    step: 20,
    lightest: 0.98,
    darkest: 0.21 // o Aplica usa 0,05; no Padrão o último tom não vira quase preto
  },
  neutrals: {
    levels: range(10, 130, 15),
    referenceLevel: 100,
    chroma: 0.1,
    lightest: 0.98,
    darkest: 0.05
  },
  behavior: { lightest: 20, active: 60, normal: 100, action: 120, pressed: 140, darkest: 180 },
  grayscale: null // gerada como rampa neutra; ver grayscale.js
});

export const PRESETS = Object.freeze({ aplica: APLICA, standard: STANDARD });

// Aceita um id ("aplica") ou um objeto de preset e valida a estrutura.
export function resolvePreset(preset = 'aplica') {
  const p = typeof preset === 'string' ? PRESETS[preset] : preset;
  if (!p) throw new Error(`Preset desconhecido: "${preset}". Use ${Object.keys(PRESETS).join(' ou ')}.`);

  const asc = (arr) => Array.isArray(arr) && arr.length >= 2 && arr.every((n, i) => Number.isFinite(n) && (i === 0 || n > arr[i - 1]));
  if (!asc(p.palette?.levels)) throw new Error('Preset: palette.levels deve ser uma lista crescente de números.');
  if (!asc(p.neutrals?.levels)) throw new Error('Preset: neutrals.levels deve ser uma lista crescente de números.');
  if (!p.palette.levels.includes(p.palette.baseLevel)) throw new Error('Preset: palette.baseLevel precisa estar em palette.levels.');
  if (!p.neutrals.levels.includes(p.neutrals.referenceLevel)) throw new Error('Preset: neutrals.referenceLevel precisa estar em neutrals.levels.');
  for (const [name, level] of Object.entries(p.behavior || {})) {
    if (!p.palette.levels.includes(level)) throw new Error(`Preset: behavior.${name} (${level}) não existe em palette.levels.`);
  }
  if (!p.behavior || !Object.keys(p.behavior).length) throw new Error('Preset: behavior não pode ser vazio.');
  return p;
}
