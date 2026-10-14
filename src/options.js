// Leitura e validação das opções. Os nomes seguem os do Aplica sempre que existem lá.
import { normalizeHex } from './color.js';

export const WCAG_AA = 4.5;
export const WCAG_AAA = 7.0;

export function resolveOptions(raw = {}, preset, warnings = []) {
  const o = raw ?? {};

  const txtOnStrategy = o.txtOnStrategy ?? 'high-contrast';
  if (!['high-contrast', 'brand-tint', 'custom-tint'].includes(txtOnStrategy)) {
    throw new Error(`txtOnStrategy inválida: "${txtOnStrategy}". Use high-contrast, brand-tint ou custom-tint.`);
  }

  let customTint = null;
  if (txtOnStrategy === 'custom-tint') {
    const c = o.txtOnCustomTint;
    if (!c || typeof c !== 'object') throw new Error('custom-tint exige txtOnCustomTint: { light?, dark?, fallback }.');
    if (c.fallback !== 'brand-tint' && c.fallback !== 'high-contrast') {
      throw new Error('txtOnCustomTint.fallback deve ser "brand-tint" ou "high-contrast".');
    }
    customTint = {
      fallback: c.fallback,
      light: c.light ? normalizeHex(c.light, 'txtOnCustomTint.light') : null,
      dark: c.dark ? normalizeHex(c.dark, 'txtOnCustomTint.dark') : null
    };
    if (!customTint.light && !customTint.dark) {
      warnings.push({ type: 'config', message: `custom-tint sem cor de claro nem de escuro: usando o fallback (${c.fallback}) em tudo.` });
    }
  }

  const order = o.colorContrastDecompose ?? 'startDark';
  if (order !== 'startDark' && order !== 'startLight') {
    throw new Error(`colorContrastDecompose inválido: "${order}". Use startDark ou startLight.`);
  }

  const overlapLevel = o.overlap && Number.isFinite(o.overlap.level) ? o.overlap.level : null;

  const darkModeChroma = o.darkModeChroma ?? 0.85;
  if (!Number.isFinite(darkModeChroma) || darkModeChroma < 0) throw new Error('darkModeChroma deve ser um número >= 0.');

  const accessibilityLevel = o.accessibilityLevel ?? 'AA';
  if (accessibilityLevel !== 'AA' && accessibilityLevel !== 'AAA') throw new Error('accessibilityLevel deve ser "AA" ou "AAA".');

  const onAccessibilityFailure = o.onAccessibilityFailure ?? 'accept-aa';
  if (!['accept-aa', 'warn', 'throw'].includes(onAccessibilityFailure)) {
    throw new Error('onAccessibilityFailure deve ser "accept-aa", "warn" ou "throw".');
  }

  // Deslocamento de borda: paleta em unidades de nível (padrão = 1 passo), neutros em passos.
  const step = preset.palette.step;
  const maxPaletteSteps = preset.palette.levels.length - 1;
  const rawPalette = Number(o.borderOffset?.palette);
  const paletteSteps = Number.isFinite(rawPalette)
    ? Math.max(1, Math.min(maxPaletteSteps, Math.round(rawPalette / step)))
    : 1;
  const rawNeutrals = Number(o.borderOffset?.neutrals);
  const neutralsSteps = Number.isFinite(rawNeutrals)
    ? Math.max(1, Math.min(preset.neutrals.levels.length - 1, Math.round(rawNeutrals)))
    : 1;
  const rawGray = Number(o.borderOffset?.grayscale);
  const grayscaleSteps = Number.isFinite(rawGray) ? Math.max(1, Math.round(rawGray)) : 1;

  // Nível onde a cor da marca fica na paleta. O padrão do Aplica é o baseLevel (100); outro nível é uma extensão.
  const brandLevel = o.brandLevel ?? preset.palette.baseLevel;
  if (!preset.palette.levels.includes(brandLevel)) {
    throw new Error(`brandLevel inválido: ${brandLevel}. Use um nível da paleta (${preset.palette.levels.join(', ')}).`);
  }

  const txtBase = Number(o.txtBaseColorLevel);

  return {
    txtOnStrategy,
    customTint,
    order,
    overlapLevel,
    darkModeChroma,
    accessibilityLevel,
    requiredRatio: accessibilityLevel === 'AAA' ? WCAG_AAA : WCAG_AA,
    onAccessibilityFailure,
    borderSteps: { palette: paletteSteps, neutrals: neutralsSteps, grayscale: grayscaleSteps },
    brandLevel,
    behaviorFollowsBrand: o.behaviorFollowsBrand === true,
    vividChroma: o.vividChroma === true,
    generateTxt: o.generateTxt === true,
    txtBaseColorLevel: Number.isFinite(txtBase) ? txtBase : 140
  };
}
