// Estado da interface e sua cópia na URL (para você compartilhar ou voltar ao mesmo ponto).

export const DEFAULTS = {
  color: '#e7398a',
  preset: 'custom',
  strategy: 'high-contrast',
  level: 'AA',
  mode: 'light',
  tab: 'palette',
  order: 'startDark',
  overlap: '',
  darkChroma: 85,
  borderPalette: '',
  borderNeutrals: '',
  lvl: '',
  normal: 'mid',
  failure: 'accept-aa',
  customLight: '',
  customDark: '',
  customFallback: 'high-contrast',
  neutralsOwn: false,
  neutralsBase: '#6b7280',
  neutralsRef: '',
  txt: false,
  sel: ''
};

const ENUMS = {
  preset: ['custom', 'aplica'],
  strategy: ['high-contrast', 'brand-tint', 'custom-tint'],
  level: ['AA', 'AAA'],
  mode: ['light', 'dark'],
  tab: ['palette', 'neutrals', 'behavior', 'grayscale'],
  order: ['startDark', 'startLight'],
  normal: ['mid', 'brand'],
  failure: ['accept-aa', 'warn', 'throw'],
  customFallback: ['high-contrast', 'brand-tint']
};
const HEX = /^#[0-9a-f]{6}$/;

export function parseHash(hash, systemMode) {
  const s = { ...DEFAULTS, mode: systemMode };
  const p = new URLSearchParams(hash.replace(/^#/, ''));
  for (const key of Object.keys(DEFAULTS)) {
    if (!p.has(key)) continue;
    const v = p.get(key);
    const def = DEFAULTS[key];
    if (ENUMS[key]) { if (ENUMS[key].includes(v)) s[key] = v; continue; }
    if (typeof def === 'boolean') { s[key] = v === '1'; continue; }
    if (key === 'color' || key === 'neutralsBase') { if (HEX.test(`#${v}`)) s[key] = `#${v}`; continue; }
    if (key === 'customLight' || key === 'customDark') { if (v === '' || HEX.test(`#${v}`)) s[key] = v ? `#${v}` : ''; continue; }
    if (key === 'darkChroma') { const n = Number(v); if (n >= 0 && n <= 150) s[key] = n; continue; }
    if (['overlap', 'borderPalette', 'borderNeutrals', 'neutralsRef', 'lvl'].includes(key)) { if (v === '' || Number.isFinite(Number(v))) s[key] = v; continue; }
    if (key === 'sel') s[key] = v.slice(0, 40);
  }
  return s;
}

export function serialize(state, systemMode) {
  const p = new URLSearchParams();
  for (const [key, def] of Object.entries(DEFAULTS)) {
    const v = state[key];
    const baseline = key === 'mode' ? systemMode : def;
    if (v === baseline) continue;
    if (typeof v === 'boolean') p.set(key, v ? '1' : '0');
    else if (typeof v === 'string' && v.startsWith('#')) p.set(key, v.slice(1));
    else p.set(key, String(v));
  }
  const q = p.toString();
  return q ? `#${q}` : '';
}
