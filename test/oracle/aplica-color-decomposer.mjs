/*
 * Cópia do ColorDecomposer de @aplica/aplica-theme-engine 3.23.4
 * (Apache-2.0, Copyright 2018-2026 Poe Bellentani), usada SOMENTE como oráculo nos testes de
 * paridade. Não faz parte do pacote.
 * Alteração: o import de "icons" (../../lib/console-icons.mjs) foi trocado por um objeto local.
 * Licença e avisos de origem: ver LICENSE e test/oracle/NOTICE-aplica-theme-engine.
 */
/**
 * ColorDecomposer - Color Scale Generator
 * 
 * Decomposes a base color into:
 * - palette: 19 levels (10-190) with surface, txtOn, border, txt
 * - neutrals: 15 levels (5-140) with surface, txtOn, border, txt
 * - behavior: 6 semantic levels (lightest, active, normal, action, pressed, darkest)
 * 
 * @see docs/context/dynamic-themes-reference/COLOR-DECOMPOSITION-SPEC.md
 */

import readline from 'readline';
const icons = { warn: '[warn]', info: '[info]', ok: '[ok]', step: '[step]' };

// Level constants
const PALETTE_LEVELS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190];
const NEUTRALS_LEVELS = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140];
const BEHAVIOR_MAPPING = {
  lightest: 10,
  active: 50,
  normal: 100,
  action: 120,
  pressed: 140,
  darkest: 170
};

// Minimum WCAG contrast ratio for text
const WCAG_AA_RATIO = 4.5;
const WCAG_AAA_RATIO = 7.0;

/**
 * Normalizes optional hex to #rrggbb or null (empty / omitted).
 * @param {string|null|undefined} hex
 * @param {string} [label] - for error messages
 * @returns {string|null}
 */
export function normalizeHexColor(hex, label = 'color') {
  if (hex == null || hex === '') return null;
  if (typeof hex !== 'string') {
    throw new Error(`Invalid ${label}: expected string, got ${typeof hex}`);
  }
  const s = hex.trim();
  if (s === '') return null;
  if (!/^#?[0-9a-fA-F]{6}$/.test(s)) {
    throw new Error(`Invalid hex ${label}: ${hex} (expected #RRGGBB)`);
  }
  const withHash = s.startsWith('#') ? s : `#${s}`;
  return withHash.toLowerCase();
}

/**
 * Converts HEX to RGB
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) throw new Error(`Invalid hex color: ${hex}`);
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  };
}

/**
 * Converts RGB to HEX
 */
function rgbToHex(r, g, b) {
  const toHex = (n) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Converts RGB to OKLch
 * @see https://bottosson.github.io/posts/oklab/
 */
function rgbToOklch(r, g, b) {
  // RGB to linear RGB
  const toLinear = (c) => {
    c = c / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);
  
  // Linear RGB to OKLab
  const l_ = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m_ = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s_ = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;
  
  const l = Math.cbrt(l_);
  const m = Math.cbrt(m_);
  const s = Math.cbrt(s_);
  
  const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
  const bVal = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
  
  // OKLab to OKLch
  const C = Math.sqrt(a * a + bVal * bVal);
  let h = Math.atan2(bVal, a) * 180 / Math.PI;
  if (h < 0) h += 360;
  
  return { L, C, h };
}

/**
 * Converts OKLch to RGB
 */
function oklchToRgb(L, C, h) {
  // OKLch to OKLab
  const hRad = h * Math.PI / 180;
  const a = C * Math.cos(hRad);
  const bVal = C * Math.sin(hRad);
  
  // OKLab to linear RGB
  const l = L + 0.3963377774 * a + 0.2158037573 * bVal;
  const m = L - 0.1055613458 * a - 0.0638541728 * bVal;
  const s = L - 0.0894841775 * a - 1.2914855480 * bVal;
  
  const l_ = l * l * l;
  const m_ = m * m * m;
  const s_ = s * s * s;
  
  let lr = +4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_;
  let lg = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_;
  let lb = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_;
  
  // Linear RGB to sRGB
  const toSrgb = (c) => {
    return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  };
  
  const r = Math.round(toSrgb(lr) * 255);
  const g = Math.round(toSrgb(lg) * 255);
  const b = Math.round(toSrgb(lb) * 255);
  
  return { r, g, b };
}

/**
 * Calculates relative luminance for WCAG
 */
function relativeLuminance(r, g, b) {
  const toLinear = (c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Calculates contrast ratio between two colors (WCAG)
 */
function contrastRatio(hex1, hex2) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  
  const l1 = relativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = relativeLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Validates contrast between text and background colors
 * @param {string} surfaceHex - Background color (hex)
 * @param {string} txtOnHex - Text color (hex)
 * @param {number} level - Level number for context (optional)
 * @param {number} requiredRatio - Minimum required contrast ratio (default: WCAG_AA_RATIO)
 * @returns {Object} Validation result with pass status, ratio, and suggestions
 */
function validateTxtOnContrast(surfaceHex, txtOnHex, level = null, requiredRatio = WCAG_AA_RATIO) {
  const ratio = contrastRatio(surfaceHex, txtOnHex);
  const passesAA = ratio >= WCAG_AA_RATIO;
  const passesAAA = ratio >= WCAG_AAA_RATIO;
  const passesRequired = ratio >= requiredRatio;
  
  // Generate suggestions if contrast fails
  let suggestions = [];
  if (!passesRequired) {
    // Try black and white to see which would work
    const blackRatio = contrastRatio(surfaceHex, '#000000');
    const whiteRatio = contrastRatio(surfaceHex, '#ffffff');
    
    if (blackRatio >= requiredRatio) {
      suggestions.push(`Use #000000 (black) - contrast ratio: ${blackRatio.toFixed(2)}:1`);
    } else if (whiteRatio >= requiredRatio) {
      suggestions.push(`Use #ffffff (white) - contrast ratio: ${whiteRatio.toFixed(2)}:1`);
    } else {
      // Neither black nor white works - surface might be mid-tone
      suggestions.push(`Surface color ${surfaceHex} may be too mid-tone. Consider adjusting surface color.`);
    }
  }
  
  return {
    passes: passesRequired,
    passesAA,
    passesAAA,
    passesRequired,
    ratio: ratio.toFixed(2),
    requiredRatio,
    level,
    surfaceHex,
    txtOnHex,
    suggestions
  };
}

/**
 * Generates color with specific lightness maintaining hue and chroma
 */
function generateColorWithLightness(baseHex, targetL, chromaMultiplier = 1) {
  const rgb = hexToRgb(baseHex);
  const oklch = rgbToOklch(rgb.r, rgb.g, rgb.b);
  
  // Adjust chroma to avoid out-of-gamut colors at extremes
  let adjustedC = oklch.C * chromaMultiplier;
  
  // Reduce chroma at lightness extremes to avoid clipping
  if (targetL > 0.9 || targetL < 0.1) {
    adjustedC = adjustedC * (1 - Math.abs(targetL - 0.5) * 0.5);
  }
  
  const newRgb = oklchToRgb(targetL, adjustedC, oklch.h);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

/**
 * Interpolates lightness for a palette level
 * @param {number} level - Level (10-190)
 * @param {number} baseL - Original lightness of base color
 * @returns {number} Interpolated lightness
 */
function interpolatePaletteLightness(level, baseL) {
  // 10 = 0.98 (almost white)
  // 100 = baseL (original)
  // 190 = 0.05 (almost black)
  
  if (level <= 100) {
    // Interpolate from 0.98 (level 10) to baseL (level 100)
    const t = (level - 10) / 90;
    return 0.98 - t * (0.98 - baseL);
  } else {
    // Interpolate from baseL (level 100) to 0.05 (level 190)
    const t = (level - 100) / 90;
    return baseL - t * (baseL - 0.05);
  }
}

/**
 * Interpolates lightness for a neutrals level
 */
function interpolateNeutralsLightness(level) {
  // 5 = 0.98 (almost white)
  // 140 = 0.05 (almost black)
  const t = (level - 5) / 135;
  return 0.98 - t * (0.98 - 0.05);
}

/**
 * Interpolates lightness for neutrals based on a reference color at a specific level
 * @param {number} level - Target level (5-140)
 * @param {number} referenceLevel - Level where the reference color sits (e.g., 100)
 * @param {number} referenceL - Lightness of the reference color (0-1)
 * @returns {number} Interpolated lightness
 */
function interpolateNeutralsFromReference(level, referenceLevel, referenceL) {
  // Calculate the lightness range based on reference
  // Level 5 = ~0.98 (almost white)
  // Level 140 = ~0.05 (almost black)
  
  if (level === referenceLevel) {
    return referenceL;
  }
  
  if (level < referenceLevel) {
    // Lighter than reference: interpolate from 0.98 to referenceL
    const t = (level - 5) / (referenceLevel - 5);
    return 0.98 - t * (0.98 - referenceL);
  } else {
    // Darker than reference: interpolate from referenceL to 0.05
    const t = (level - referenceLevel) / (140 - referenceLevel);
    return referenceL - t * (referenceL - 0.05);
  }
}

/**
 * Main color decomposition class
 */
export class ColorDecomposer {
  constructor(options = {}) {
    this.txtOnStrategy = options.txtOnStrategy || 'high-contrast'; // 'high-contrast' | 'brand-tint' | 'custom-tint'

    /** @type {string|null} */
    this.customTintLight = null;
    /** @type {string|null} */
    this.customTintDark = null;
    /** @type {'brand-tint'|'high-contrast'} */
    this.customTintFallback = 'high-contrast';

    if (this.txtOnStrategy === 'custom-tint') {
      const raw = options.txtOnCustomTint;
      if (!raw || typeof raw !== 'object') {
        throw new Error('ColorDecomposer: options.txtOnCustomTint is required when txtOnStrategy is "custom-tint"');
      }
      const fb = raw.fallback;
      if (fb !== 'brand-tint' && fb !== 'high-contrast') {
        throw new Error('ColorDecomposer: txtOnCustomTint.fallback must be "brand-tint" or "high-contrast"');
      }
      this.customTintFallback = fb;
      if (raw.light != null && raw.light !== '') {
        this.customTintLight = normalizeHexColor(raw.light, 'txtOnCustomTint.light');
      }
      if (raw.dark != null && raw.dark !== '') {
        this.customTintDark = normalizeHexColor(raw.dark, 'txtOnCustomTint.dark');
      }
      if (!this.customTintLight && !this.customTintDark) {
        console.warn(
          `${icons.warn} txtOnCustomTint: neither light nor dark is set; using fallback (${this.customTintFallback}) for all surfaces.\n`
        );
      }
    }
    
    // Color contrast decomposition order: 'startDark' (default) or 'startLight'
    const order = options.colorContrastDecompose ?? 'startDark';
    this.contrastDecomposeOrder = (order === 'startLight' || order === 'startDark') ? order : 'startDark';

    // overlap: when brand-tint, skip palette walk for surfaces at or above this scale level
    // and jump directly to the high-contrast extreme (direction from contrastDecomposeOrder).
    // Config: overlap: { level: 100 } — or false/absent to disable.
    this.overlapLevel = null;
    const rawOverlap = options.overlap;
    if (rawOverlap && typeof rawOverlap === 'object' && Number.isFinite(rawOverlap.level)) {
      this.overlapLevel = rawOverlap.level;
    }
    
    // Dark mode chroma factor (1.0 = same as light, 0.8 = 20% less saturated)
    // Lower values reduce saturation in dark mode for better eye comfort
    this.darkModeChroma = options.darkModeChroma ?? 0.85;
    
    // Accessibility level: 'AA' (4.5:1) or 'AAA' (7:1)
    // Default: 'AA' (WCAG AA is the industry standard minimum)
    this.accessibilityLevel = options.accessibilityLevel || 'AA';
    this.requiredRatio = this.accessibilityLevel === 'AAA' ? WCAG_AAA_RATIO : WCAG_AA_RATIO;
    
    // Border offset per group (fallback when not declared: palette 10, neutrals 1)
    const paletteOffset = parseInt(options.borderOffset?.palette, 10);
    const neutralsOffset = parseInt(options.borderOffset?.neutrals, 10);
    this.borderOffsetPalette = Number.isFinite(paletteOffset) ? Math.max(1, Math.min(180, paletteOffset)) : 10;
    this.borderOffsetNeutrals = Number.isFinite(neutralsOffset) ? Math.max(1, Math.min(NEUTRALS_LEVELS.length - 1, neutralsOffset)) : 1;
    this.generateTxt = options.generateTxt === true;
    const txtBaseColorLevel = parseInt(options.txtBaseColorLevel, 10);
    this.txtBaseColorLevel = Number.isFinite(txtBaseColorLevel) ? txtBaseColorLevel : null;
    
    // Validation options
    this.options = {
      strictValidation: options.strictValidation ?? false, // Throw error on contrast failures
      acceptAALevelFallback: options.acceptAALevelFallback ?? false, // Auto-accept AA when AAA fails
      interactiveFallback: options.interactiveFallback ?? true, // Ask user when AAA fails
      ...options
    };
    
    // Store validation failures for batch processing
    this.validationFailures = [];
  }

  resolveTxtLevel(levels, fallbackLevel = 140) {
    const preferredLevel = Number.isFinite(this.txtBaseColorLevel)
      ? this.txtBaseColorLevel
      : fallbackLevel;

    return levels.reduce((closest, level) => {
      const currentDistance = Math.abs(level - preferredLevel);
      const bestDistance = Math.abs(closest - preferredLevel);
      return currentDistance < bestDistance ? level : closest;
    }, levels[0]);
  }

  generateTxtReference(surface, border, levels) {
    if (!this.generateTxt) {
      return null;
    }
    const txt = {};
    const targetLevel = this.resolveTxtLevel(levels, 140);
    const preferredValue = surface[targetLevel] ?? border[targetLevel] ?? '#000000';
    for (const level of levels) {
      txt[level] = preferredValue;
    }
    return txt;
  }

  /**
   * When txtOnStrategy is custom-tint: uses brand-tint or high-contrast as configured fallback.
   * @param {string} surfaceHex
   * @param {object|null} palette - palette surface map (required for brand-tint fallback on palette scale)
   */
  applyFallbackTxtOn(surfaceHex, palette) {
    if (this.customTintFallback === 'brand-tint' && palette) {
      return this.findAccessibleBrandTint(surfaceHex, palette);
    }
    return this.generateHighContrastTxtOn(surfaceHex);
  }

  /**
   * Generates txtOn based on configured strategy
   * @param {string} surfaceHex
   * @param {object|null} palette - full palette surface map for brand-tint (palette scale only)
   * @param {'light'|'dark'} mode - light vs dark custom tint
   * @param {number|null} surfaceLevel - palette scale level of the surface, when known at call site
   */
  generateTxtOn(surfaceHex, palette = null, mode = 'light', surfaceLevel = null) {
    if (this.txtOnStrategy === 'custom-tint') {
      const custom = mode === 'dark' ? this.customTintDark : this.customTintLight;
      if (!custom) {
        return this.applyFallbackTxtOn(surfaceHex, palette);
      }
      if (contrastRatio(surfaceHex, custom) >= this.requiredRatio) {
        return custom;
      }
      return this.applyFallbackTxtOn(surfaceHex, palette);
    }
    if (this.txtOnStrategy === 'brand-tint' && palette) {
      return this.findAccessibleBrandTint(surfaceHex, palette, surfaceLevel);
    }
    return this.generateHighContrastTxtOn(surfaceHex);
  }

  /**
   * Reverse-looks up a hex value in the palette map to find its scale level.
   * Returns null for adapted/diluted colors that don't match any palette entry exactly.
   * @param {string} surfaceHex
   * @param {object} palette - { 10: '#hex', 20: '#hex', ... }
   * @returns {number|null}
   */
  _detectPaletteLevel(surfaceHex, palette) {
    const normalized = surfaceHex.toLowerCase();
    for (const [k, v] of Object.entries(palette)) {
      if (typeof v === 'string' && v.toLowerCase() === normalized) return parseInt(k, 10);
    }
    return null;
  }

  /**
   * Strategy 1: High contrast (black or white)
   * Uses configured accessibility level (AA or AAA)
   */
  generateHighContrastTxtOn(surfaceHex) {
    const blackContrast = contrastRatio(surfaceHex, '#000000');
    const whiteContrast = contrastRatio(surfaceHex, '#ffffff');
    if (this.contrastDecomposeOrder === 'startLight') {
      return whiteContrast >= this.requiredRatio ? '#ffffff' : '#000000';
    }
    return blackContrast >= this.requiredRatio ? '#000000' : '#ffffff';
  }

  /**
   * Strategy 2: Finds accessible color from palette (brand tint)
   * @param {string} surfaceHex
   * @param {object} palette - { 10: '#hex', 20: '#hex', ... }
   * @param {number|null} surfaceLevel - palette scale level, passed from call site or detected
   */
  findAccessibleBrandTint(surfaceHex, palette, surfaceLevel = null) {
    // Resolve the scale level: use explicit param, or detect via reverse palette lookup
    const level = surfaceLevel ?? this._detectPaletteLevel(surfaceHex, palette);

    // overlap gate: skip palette walk for surfaces at or above the declared level threshold
    if (this.overlapLevel !== null && level !== null && level >= this.overlapLevel) {
      return this.generateHighContrastTxtOn(surfaceHex);
    }

    const rgb = hexToRgb(surfaceHex);
    const surfaceL = rgbToOklch(rgb.r, rgb.g, rgb.b).L;

    // If surface is light, search dark colors; if dark, search light colors
    const searchDark = surfaceL > 0.5;
    // startDark: searchDark -> reverse (darkest first), else normal (lightest first)
    // startLight: invert the order (lightest first when searchDark, darkest first when searchLight)
    const useReverse = searchDark !== (this.contrastDecomposeOrder === 'startLight');
    const levels = useReverse ? [...PALETTE_LEVELS].reverse() : [...PALETTE_LEVELS];

    for (const lvl of levels) {
      const candidateHex = palette[lvl];
      if (candidateHex && contrastRatio(surfaceHex, candidateHex) >= this.requiredRatio) {
        return candidateHex;
      }
    }

    // Fallback to high contrast if no palette color passes
    return this.generateHighContrastTxtOn(surfaceHex);
  }

  /**
   * Generates palette scale (19 levels)
   */
  async generatePalette(baseHex, mode = 'light') {
    const rgb = hexToRgb(baseHex);
    const oklch = rgbToOklch(rgb.r, rgb.g, rgb.b);
    const baseL = oklch.L;
    
    const surface = {};
    const border = {};
    
    // Chroma multiplier: 1.0 for light mode, configurable for dark mode
    const chromaMultiplier = mode === 'dark' ? this.darkModeChroma : 1.0;
    
    // Generate surface for each level
    for (const level of PALETTE_LEVELS) {
      // Level 100 = "default" in brand.branding: use declared color as-is (no OKLCH round-trip).
      // Ensures config.colors (brand, action, etc.) and overrides are preserved exactly.
      if (level === 100) {
        surface[level] = baseHex;
        continue;
      }
      let targetL = interpolatePaletteLightness(level, baseL);
      if (mode === 'dark') {
        targetL = interpolatePaletteLightness(200 - level, baseL);
      }
      surface[level] = generateColorWithLightness(baseHex, targetL, chromaMultiplier);
    }
    
    // Generate border (offset from surface; offset configurable via options.borderOffset.palette)
    const offset = this.borderOffsetPalette;
    for (const level of PALETTE_LEVELS) {
      if (mode === 'light') {
        // Border is one shade darker (next level)
        const borderLevel = Math.max(10, Math.min(level + offset, 190));
        border[level] = surface[borderLevel] || surface[190];
      } else {
        // Dark mode: border is one shade lighter (next level in inverted scale)
        const borderLevel = Math.max(10, Math.min(level + offset, 190));
        border[level] = surface[borderLevel] || surface[190];
      }
    }
    
    // Generate txtOn based on strategy
    const txtOn = {};
    for (const level of PALETTE_LEVELS) {
      txtOn[level] = this.generateTxtOn(surface[level], surface, mode);
    }
    const txt = this.generateTxtReference(surface, border, PALETTE_LEVELS);
    
    // Validate all generated txtOn values
    const validationFailures = [];
    for (const level of PALETTE_LEVELS) {
      const validation = validateTxtOnContrast(surface[level], txtOn[level], level, this.requiredRatio);
      if (!validation.passes) {
        validationFailures.push({
          type: 'palette',
          level,
          surface: surface[level],
          txtOn: txtOn[level],
          ratio: validation.ratio,
          requiredRatio: this.requiredRatio,
          validation
        });
      }
    }
    
    // Handle validation failures
    if (validationFailures.length > 0) {
      await this.handleValidationFailures(validationFailures, 'palette');
      
      // Regenerate txtOn for failed levels with AA fallback if accepted
      for (const failure of validationFailures) {
        if (failure.acceptedAALevel) {
          // Regenerate with AA requirement (respect contrastDecomposeOrder)
          const aaValidation = validateTxtOnContrast(failure.surface, txtOn[failure.level], failure.level, WCAG_AA_RATIO);
          if (!aaValidation.passes) {
            const blackContrast = contrastRatio(failure.surface, '#000000');
            const whiteContrast = contrastRatio(failure.surface, '#ffffff');
            if (this.contrastDecomposeOrder === 'startLight') {
              txtOn[failure.level] = whiteContrast >= WCAG_AA_RATIO ? '#ffffff' : '#000000';
            } else {
              txtOn[failure.level] = blackContrast >= WCAG_AA_RATIO ? '#000000' : '#ffffff';
            }
          }
        }
      }
    }
    
    return this.generateTxt ? { surface, txtOn, border, txt } : { surface, txtOn, border };
  }

  /**
   * Generates neutrals scale (15 levels)
   * @param {string} baseHex - Base color hex (used if no override)
   * @param {string} mode - 'light' or 'dark'
   * @param {object} override - Optional override configuration
   *   - baseColor: Custom hex color to use as neutrals base
   *   - referenceLevel: Which level (5-140) the baseColor represents (default: 100)
   *   - surface: Manual overrides for surface values { '100': '#...' }
   *   - txtOn: Manual overrides for txtOn values
   *   - border: Manual overrides for border values
   */
  async generateNeutrals(baseHex, mode = 'light', override = null) {
    // Determine which color to use as base
    let neutralsBaseHex = baseHex;
    let referenceLevel = 100;
    let referenceL = null;
    
    if (override?.baseColor) {
      neutralsBaseHex = override.baseColor;
      referenceLevel = override.referenceLevel ?? 100;
      
      // Extract lightness from reference color
      const refRgb = hexToRgb(neutralsBaseHex);
      const refOklch = rgbToOklch(refRgb.r, refRgb.g, refRgb.b);
      referenceL = refOklch.L;
    }
    
    const rgb = hexToRgb(neutralsBaseHex);
    const oklch = rgbToOklch(rgb.r, rgb.g, rgb.b);
    
    const surface = {};
    const border = {};
    
    // Reduced chroma for neutrals (10% of original, or use original if override)
    // Also apply dark mode chroma reduction
    const baseChroma = override?.baseColor ? 1 : 0.1;
    const chromaMultiplier = mode === 'dark' 
      ? baseChroma * this.darkModeChroma 
      : baseChroma;
    
    for (const level of NEUTRALS_LEVELS) {
      let targetL;
      
      if (referenceL !== null) {
        // Use reference-based interpolation
        targetL = interpolateNeutralsFromReference(level, referenceLevel, referenceL);
        
        // Dark mode: mirror around reference level
        if (mode === 'dark') {
          const mirroredLevel = 145 - level;
          targetL = interpolateNeutralsFromReference(mirroredLevel, referenceLevel, referenceL);
        }
      } else {
        // Default interpolation
        targetL = interpolateNeutralsLightness(level);
        
        // Dark mode: invert the scale
        if (mode === 'dark') {
          targetL = interpolateNeutralsLightness(145 - level);
        }
      }
      
      surface[level] = generateColorWithLightness(neutralsBaseHex, targetL, chromaMultiplier);
    }
    
    // Generate border (offset from surface; offset configurable via options.borderOffset.neutrals)
    const step = this.borderOffsetNeutrals;
    for (const level of NEUTRALS_LEVELS) {
      if (mode === 'light') {
        const idx = NEUTRALS_LEVELS.indexOf(level);
        const nextIdx = Math.min(idx + step, NEUTRALS_LEVELS.length - 1);
        const borderLevel = NEUTRALS_LEVELS[nextIdx];
        border[level] = surface[borderLevel];
      } else {
        // Dark mode: border is one step lighter (next level in scale)
        const idx = NEUTRALS_LEVELS.indexOf(level);
        const nextIdx = Math.min(idx + step, NEUTRALS_LEVELS.length - 1);
        const borderLevel = NEUTRALS_LEVELS[nextIdx];
        border[level] = surface[borderLevel];
      }
    }
    
    // Apply surface overrides FIRST (before generating txtOn)
    // This ensures txtOn is calculated based on the final surface values
    if (override?.surface) {
      for (const [level, value] of Object.entries(override.surface)) {
        surface[parseInt(level)] = value;
      }
    }
    
    // Generate txtOn based on final surface values (after overrides)
    // This ensures accessibility is maintained even when surface is overridden
    const txtOn = {};
    const validationErrors = [];
    const validationWarnings = [];
    
    for (const level of NEUTRALS_LEVELS) {
      // If txtOn override exists for this level, use it (manual override has priority)
      if (override?.txtOn && override.txtOn[level.toString()]) {
        const overrideTxtOn = override.txtOn[level.toString()];
        txtOn[level] = overrideTxtOn;
        
        // Validate contrast for manual override using configured accessibility level
        const validation = validateTxtOnContrast(surface[level], overrideTxtOn, level, this.requiredRatio);
        const levelName = this.accessibilityLevel;
        const requiredRatioStr = this.requiredRatio.toFixed(1);
        
        if (!validation.passes) {
          const errorMsg = 
            `[warn] Accessibility Warning: Manual txtOn override for level ${level} fails WCAG ${levelName} contrast.\n` +
            `   - Surface: ${surface[level]}\n` +
            `   - Text:    ${overrideTxtOn}\n` +
            `   - Ratio:   ${validation.ratio}:1 (required: ${requiredRatioStr}:1 for WCAG ${levelName})\n` +
            (validation.suggestions.length > 0 
              ? `   - Suggestions:\n${validation.suggestions.map(s => `      - ${s}`).join('\n')}\n`
              : `   - No automatic suggestions available. Please adjust colors manually.\n`);
          
          validationWarnings.push(errorMsg);
        } else if (this.accessibilityLevel === 'AA' && !validation.passesAAA) {
          // Only show AAA info if we're using AA as requirement
          // Passes AA but not AAA - informational only
          const infoMsg = 
            `${icons.info} Info: Manual txtOn override for level ${level} passes WCAG AA but not AAA.\n` +
            `   - Surface: ${surface[level]}\n` +
            `   - Text:    ${overrideTxtOn}\n` +
            `   - Ratio:   ${validation.ratio}:1 (AAA requires ${WCAG_AAA_RATIO}:1 for enhanced accessibility)`;
          
          validationWarnings.push(infoMsg);
        }
      } else {
        // Generate txtOn based on final surface value (may have been overridden)
        txtOn[level] = this.generateTxtOn(surface[level], null, mode);
        
        // Validate generated txtOn
        const validation = validateTxtOnContrast(surface[level], txtOn[level], level, this.requiredRatio);
        if (!validation.passes) {
          validationWarnings.push({
            type: 'neutrals',
            level,
            surface: surface[level],
            txtOn: txtOn[level],
            ratio: validation.ratio,
            requiredRatio: this.requiredRatio,
            validation
          });
        }
      }
    }
    
    // Handle validation failures (both overrides and generated)
    const generatedFailures = validationWarnings.filter(w => typeof w === 'object' && w.type === 'neutrals');
    const overrideFailures = validationWarnings.filter(w => typeof w === 'string');
    
    if (generatedFailures.length > 0) {
      await this.handleValidationFailures(generatedFailures, 'neutrals');
      
      // Regenerate txtOn for failed levels with AA fallback if accepted
      for (const failure of generatedFailures) {
        if (failure.acceptedAALevel) {
          const blackContrast = contrastRatio(failure.surface, '#000000');
          const whiteContrast = contrastRatio(failure.surface, '#ffffff');
          if (this.contrastDecomposeOrder === 'startLight') {
            txtOn[failure.level] = whiteContrast >= WCAG_AA_RATIO ? '#ffffff' : '#000000';
          } else {
            txtOn[failure.level] = blackContrast >= WCAG_AA_RATIO ? '#000000' : '#ffffff';
          }
        }
      }
    }
    
    // Emit validation warnings for overrides (legacy format)
    if (overrideFailures.length > 0) {
      const context = override?.baseColor 
        ? `neutrals (baseColor: ${override.baseColor})`
        : 'neutrals';
      
      console.warn(`\n${icons.step} Contrast Validation Results for ${context}:\n`);
      overrideFailures.forEach(warning => console.warn(warning));
      
      // If there are failures, also throw or return error info
      const failures = overrideFailures.filter(w => w.includes(icons.warn));
      if (failures.length > 0 && this.options?.strictValidation) {
        throw new Error(`Accessibility validation failed: ${failures.length} txtOn override(s) do not meet WCAG ${this.accessibilityLevel} contrast requirements.`);
      }
    }
    
    // Apply border overrides
    if (override?.border) {
      for (const [level, value] of Object.entries(override.border)) {
        border[parseInt(level)] = value;
      }
    }
    
    const txt = this.generateTxtReference(surface, border, NEUTRALS_LEVELS);

    return this.generateTxt ? { surface, txtOn, border, txt } : { surface, txtOn, border };
  }

  /**
   * Generates behavior (references to palette)
   */
  generateBehavior(colorName, mode = 'light') {
    const prefix = `{_color_palette.mode.${mode}.${colorName}.palette`;
    
    const surface = {};
    const txtOn = {};
    const border = {};
    const txt = this.generateTxt ? {} : null;
    
    for (const [name, level] of Object.entries(BEHAVIOR_MAPPING)) {
      surface[name] = `${prefix}.surface.${level}}`;
      txtOn[name] = `${prefix}.txtOn.${level}}`;
      border[name] = `${prefix}.border.${level}}`;
      if (this.generateTxt) {
        txt[name] = `${prefix}.txt.${level}}`;
      }
    }

    return this.generateTxt ? { surface, txtOn, border, txt } : { surface, txtOn, border };
  }

  /**
   * Decomposes a color completely
   * @param {string} colorName - Name of the color
   * @param {string} baseHex - Base hex color
   * @param {string} mode - 'light' or 'dark'
   * @param {object} neutralsOverride - Optional neutrals override config
   */
  async decompose(colorName, baseHex, mode = 'light', neutralsOverride = null) {
    const palette = await this.generatePalette(baseHex, mode);
    const neutrals = await this.generateNeutrals(baseHex, mode, neutralsOverride);
    const behavior = this.generateBehavior(colorName, mode);
    
    return {
      palette,
      neutrals,
      behavior
    };
  }

  /**
   * Handles validation failures with user interaction
   * @param {Array} failures - Array of failure objects
   * @param {string} context - Context string (e.g., 'palette', 'neutrals')
   */
  async handleValidationFailures(failures, context) {
    if (failures.length === 0) return;
    
    // Only handle AAA failures (if configured for AAA)
    if (this.accessibilityLevel !== 'AAA') return;
    
    const levelName = this.accessibilityLevel;
    const requiredRatioStr = this.requiredRatio.toFixed(1);
    
    console.warn(`\n${icons.warn} Accessibility Warning: ${failures.length} token(s) in ${context} fail WCAG ${levelName} contrast (required: ${requiredRatioStr}:1)\n`);
    
    // Show first few failures as examples
    const examplesToShow = Math.min(3, failures.length);
    for (let i = 0; i < examplesToShow; i++) {
      const f = failures[i];
      console.warn(
        `   - ${context} level ${f.level}\n` +
        `   - Background: ${f.surface}\n` +
        `   - Text:       ${f.txtOn}\n` +
        `   - Ratio:      ${f.ratio}:1 (required: ${requiredRatioStr}:1 for WCAG ${levelName})\n`
      );
    }
    
    if (failures.length > examplesToShow) {
      console.warn(`   ... and ${failures.length - examplesToShow} more failure(s)\n`);
    }
    
    // Auto-accept AA if configured
    if (this.options.acceptAALevelFallback) {
      console.warn(`${icons.info} Auto-accepting AA level (4.5:1) for all ${failures.length} failure(s)...\n`);
      failures.forEach(f => f.acceptedAALevel = true);
      return;
    }
    
    // Interactive mode
    if (this.options.interactiveFallback && process.stdin.isTTY) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      try {
        const answer = await new Promise((resolve) => {
          console.warn(`Options:\n`);
          console.warn(`  [1] Cancel generation (recommended)`);
          console.warn(`  [2] Accept AA level (4.5:1) for all ${failures.length} failure(s)`);
          console.warn(`  [3] Accept AA level for each failure individually`);
          console.warn(`  [4] Accept AA level for all failures AND bypass for all future validations\n`);
          rl.question('Choose [1/2/3/4]: ', resolve);
        });
        
        if (answer.trim() === '1') {
          // Cancel generation
          rl.close();
          throw new Error(`Generation cancelled: ${failures.length} token(s) do not meet WCAG ${levelName} contrast requirements.`);
        } else if (answer.trim() === '2') {
          // Accept AA level for all failures
          console.warn(`\n${icons.ok} Accepting AA level for all ${failures.length} failure(s)...\n`);
          failures.forEach(f => f.acceptedAALevel = true);
        } else if (answer.trim() === '3') {
          // Individual handling
          for (const failure of failures) {
            const answer = await new Promise((resolve) => {
              console.warn(
                `\n${icons.warn} ${context} level ${failure.level}: Ratio ${failure.ratio}:1 (required: ${requiredRatioStr}:1)\n` +
                `   - Background: ${failure.surface}\n` +
                `   - Text:       ${failure.txtOn}\n`
              );
              rl.question('Accept AA level (4.5:1) for this token? [y/n]: ', resolve);
            });
            
            if (answer.trim().toLowerCase() === 'y') {
              failure.acceptedAALevel = true;
            }
          }
        } else if (answer.trim() === '4') {
          // Accept AA level AND enable bypass for all future validations
          console.warn(`\n${icons.ok} Accepting AA level for all ${failures.length} failure(s) and enabling bypass for all future validations...\n`);
          console.warn(`   Note: To persist bypass, set acceptAALevelFallback: true in config file\n`);
          failures.forEach(f => f.acceptedAALevel = true);
          // Enable bypass for this and future validations in this session
          this.options.acceptAALevelFallback = true;
        } else {
          rl.close();
          throw new Error(`Generation cancelled: ${failures.length} token(s) do not meet WCAG ${levelName} contrast requirements.`);
        }
      } finally {
        rl.close();
      }
    } else {
      // Non-interactive mode - throw error
      if (this.options.strictValidation) {
        throw new Error(`Accessibility validation failed: ${failures.length} token(s) in ${context} do not meet WCAG ${levelName} contrast requirements. Use acceptAALevelFallback option to auto-accept AA level.`);
      } else {
        console.warn(`${icons.warn} Non-interactive mode: ${failures.length} token(s) fail WCAG ${levelName}. Consider using acceptAALevelFallback option.\n`);
      }
    }
  }

  /**
   * Formats output for Design Tokens format
   */
  formatAsTokens(colorName, decomposed, mode = 'light') {
    const formatValue = (value, isReference = false) => ({
      "$type": "color",
      "$value": value
    });

    const formatScale = (scale, isReference = false) => {
      const result = {};
      for (const [key, value] of Object.entries(scale)) {
        result[key] = formatValue(value, isReference);
      }
      return result;
    };

    return {
      [colorName]: {
        palette: {
          surface: formatScale(decomposed.palette.surface),
          txtOn: formatScale(decomposed.palette.txtOn),
          border: formatScale(decomposed.palette.border)
        },
        neutrals: {
          surface: formatScale(decomposed.neutrals.surface),
          txtOn: formatScale(decomposed.neutrals.txtOn),
          border: formatScale(decomposed.neutrals.border)
        },
        behavior: {
          surface: formatScale(decomposed.behavior.surface, true),
          txtOn: formatScale(decomposed.behavior.txtOn, true),
          border: formatScale(decomposed.behavior.border, true)
        }
      }
    };
  }
}

// Export constants for external use
export { PALETTE_LEVELS, NEUTRALS_LEVELS, BEHAVIOR_MAPPING };

// Export utility functions
export { hexToRgb, rgbToHex, rgbToOklch, oklchToRgb, contrastRatio, validateTxtOnContrast };
