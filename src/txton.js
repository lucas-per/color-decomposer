// Cor do texto sobre cada superfície (txtOn) e verificação de contraste.
import { contrastRatio, hexToOklch } from './color.js';
import { WCAG_AA, WCAG_AAA } from './options.js';

export function highContrast(cfg, surface, required = cfg.requiredRatio) {
  if (cfg.order === 'startLight') {
    return contrastRatio(surface, '#ffffff') >= required ? '#ffffff' : '#000000';
  }
  return contrastRatio(surface, '#000000') >= required ? '#000000' : '#ffffff';
}

// brand-tint: percorre a própria paleta e devolve a primeira cor que passa no contraste.
// Em superfície clara procura do mais escuro para o mais claro (startDark); startLight inverte.
function brandTint(cfg, surface, paletteSurface, levels, surfaceLevel) {
  if (cfg.overlapLevel !== null && surfaceLevel !== null && surfaceLevel >= cfg.overlapLevel) {
    return highContrast(cfg, surface);
  }
  const surfaceIsLight = hexToOklch(surface).L > 0.5;
  const reverse = surfaceIsLight !== (cfg.order === 'startLight');
  const order = reverse ? [...levels].reverse() : levels;
  for (const level of order) {
    const candidate = paletteSurface[level];
    if (candidate && contrastRatio(surface, candidate) >= cfg.requiredRatio) return candidate;
  }
  return highContrast(cfg, surface);
}

function fallback(cfg, surface, paletteSurface, levels, surfaceLevel) {
  if (cfg.customTint.fallback === 'brand-tint' && paletteSurface) {
    return brandTint(cfg, surface, paletteSurface, levels, surfaceLevel);
  }
  return highContrast(cfg, surface);
}

// paletteSurface/levels só existem na paleta; nos neutros o brand-tint cai em alto contraste.
export function txtOnFor(cfg, surface, mode, { paletteSurface = null, levels = null, level = null } = {}) {
  if (cfg.txtOnStrategy === 'custom-tint') {
    const custom = mode === 'dark' ? cfg.customTint.dark : cfg.customTint.light;
    if (custom && contrastRatio(surface, custom) >= cfg.requiredRatio) return custom;
    return fallback(cfg, surface, paletteSurface, levels, level);
  }
  if (cfg.txtOnStrategy === 'brand-tint' && paletteSurface) {
    return brandTint(cfg, surface, paletteSurface, levels, level);
  }
  return highContrast(cfg, surface);
}

export function checkPair(surface, text, required) {
  const ratio = contrastRatio(surface, text);
  return { ratio, passes: ratio >= required, passesAA: ratio >= WCAG_AA, passesAAA: ratio >= WCAG_AAA };
}

// `recheck`: no Aplica, a paleta mantém o texto se ele já passa no AA, e os neutros sempre refazem
// (preto/branco em 4,5:1). Reproduzimos os dois comportamentos.
// Só o nível AAA tem tratamento de falha: no AA, preto/branco sempre alcança 4,5:1.
// onAccessibilityFailure: "accept-aa" cai para preto/branco em 4,5:1 e avisa; "warn" mantém o valor
// (como o Aplica faz sem terminal interativo) e avisa; "throw" interrompe.
export function resolveFailures(cfg, { group, mode, levels, surface, txtOn, recheck = true }, warnings) {
  if (cfg.accessibilityLevel !== 'AAA') return;
  const failures = levels.filter((l) => !checkPair(surface[l], txtOn[l], cfg.requiredRatio).passes);
  if (!failures.length) return;

  if (cfg.onAccessibilityFailure === 'throw') {
    const where = `${group === 'palette' ? 'paleta' : 'neutros'}, modo ${mode === 'dark' ? 'escuro' : 'claro'}`;
    throw new Error(`${failures.length} ${failures.length === 1 ? 'tom não chega' : 'tons não chegam'} a 7 para 1 (AAA) com o texto gerado (${where}): níveis ${failures.join(', ')}.`);
  }
  for (const level of failures) {
    const accept = cfg.onAccessibilityFailure === 'accept-aa';
    if (accept && (!recheck || !checkPair(surface[level], txtOn[level], WCAG_AA).passes)) {
      txtOn[level] = highContrast(cfg, surface[level], WCAG_AA);
    }
    warnings.push({
      type: 'accessibility',
      group, mode, level,
      surface: surface[level],
      txtOn: txtOn[level],
      ratio: contrastRatio(surface[level], txtOn[level]),
      required: cfg.requiredRatio,
      accepted: accept ? 'AA' : null
    });
  }
}
