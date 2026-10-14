// Matemática de cor em OKLCh e contraste WCAG.
// Reproduz as fórmulas e constantes do decomposer oficial do Aplica (v3.23.4),
// inclusive o limiar 0.03928 da luminância relativa, para que a saída bata byte a byte.

export function normalizeHex(hex, label = 'cor') {
  if (typeof hex !== 'string') throw new Error(`${label} inválida: esperava texto, recebi ${typeof hex}`);
  const s = hex.trim();
  if (!/^#?[0-9a-fA-F]{6}$/.test(s)) throw new Error(`${label} inválida: "${hex}" (use o formato #RRGGBB)`);
  return (s.startsWith('#') ? s : `#${s}`).toLowerCase();
}

export function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) throw new Error(`Hex inválido: ${hex}`);
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

export function rgbToHex(r, g, b) {
  const to = (n) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

export function rgbToOklch(r, g, b) {
  const lin = (c) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const lr = lin(r), lg = lin(g), lb = lin(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  let h = (Math.atan2(bb, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { L, C: Math.sqrt(a * a + bb * bb), h };
}

export function oklchToRgb(L, C, h) {
  const hr = (h * Math.PI) / 180;
  const a = C * Math.cos(hr), b = C * Math.sin(hr);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lr = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  const srgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
  return { r: Math.round(srgb(lr) * 255), g: Math.round(srgb(lg) * 255), b: Math.round(srgb(lb) * 255) };
}

export function relativeLuminance(r, g, b) {
  const lin = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(hex1, hex2) {
  const a = hexToRgb(hex1), b = hexToRgb(hex2);
  const l1 = relativeLuminance(a.r, a.g, a.b), l2 = relativeLuminance(b.r, b.g, b.b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export function hexToOklch(hex) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToOklch(r, g, b);
}

// Fração do croma máximo (dentro do sRGB) que a cor viva dá a cada tom, e croma mínimo para a cor ter matiz.
export const VIVID_RATIO = 0.85;
export const VIVID_MIN_CHROMA = 0.004;

// Cor com a luminosidade pedida, mantendo matiz e croma (com redução nos extremos).
// `base` é o OKLCh da cor de origem; `chromaFactor` multiplica o croma antes da redução.
export function colorAtLightness(base, targetL, chromaFactor = 1, vivid = false, gamutMap = false) {
  let C = base.C * chromaFactor;
  // Cor viva (extensão): sobe a intensidade até a fração do máximo possível para a claridade e o matiz, de forma gradual. Nunca reduz.
  // `vivid` é o peso de 0 a 1 (true vale 1): a intensidade vai da atual até o alvo na proporção do peso.
  const w = vivid === true ? 1 : Number(vivid) || 0;
  if (w > 0 && base.C >= VIVID_MIN_CHROMA) {
    const target = Math.min(VIVID_RATIO * chromaFactor, 1) * maxChroma(targetL, base.h);
    if (target > C) C += (target - C) * w;
  }
  if (gamutMap !== 'full' && (targetL > 0.9 || targetL < 0.1)) C *= 1 - Math.abs(targetL - 0.5) * 0.5; // contra o corte nas pontas; com mapeamento total não precisa
  // Extensão (presets com `gamutMap`): nos tons escuros, reduz a intensidade até caber no sRGB, mantendo o matiz. Sem ela,
  // o corte por canal do Aplica desloca o matiz (um amarelo escuro vira vermelho). Os tons claros seguem o Aplica.
  // Com `'full'` (cor de apoio), todos os tons são mapeados, para os passos entre as cores ficarem iguais.
  if (gamutMap === 'full' || (gamutMap && targetL < 0.5)) C = Math.min(C, maxChroma(targetL, base.h));
  const { r, g, b } = oklchToRgb(targetL, C, base.h);
  return rgbToHex(r, g, b);
}

// OKLab (L, a, b) de um hex. Serve para medir a distância perceptual entre duas cores.
export function hexToOklab(hex) {
  const { L, C, h } = hexToOklch(hex);
  const hr = (h * Math.PI) / 180;
  return { L, a: C * Math.cos(hr), b: C * Math.sin(hr) };
}

// Distância perceptual (ΔE OK): distância euclidiana em OKLab. Perto de 0,02 já é o mínimo perceptível.
export function deltaEOk(hex1, hex2) {
  const x = hexToOklab(hex1), y = hexToOklab(hex2);
  return Math.hypot(x.L - y.L, x.a - y.a, x.b - y.b);
}

// Maior croma que o sRGB consegue exibir para uma claridade e um matiz (busca binária).
export function maxChroma(L, h) {
  const inGamut = (C) => {
    const { r, g, b } = oklchToRgb(L, C, h);
    return r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255;
  };
  if (L <= 0 || L >= 1) return 0;
  let lo = 0, hi = 0.4;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut(mid)) lo = mid; else hi = mid;
  }
  return lo;
}

// Hex a partir de L, C e matiz. Se o croma não cabe no sRGB, reduz o croma e mantém claridade e matiz.
export function oklchToHex(L, C, h) {
  const used = Math.min(C, maxChroma(L, h));
  const { r, g, b } = oklchToRgb(L, used, h);
  return { hex: rgbToHex(r, g, b), chroma: used, clipped: C > used + 1e-6 };
}
