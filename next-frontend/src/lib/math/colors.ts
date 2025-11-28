import {ColorTranslator} from "colortranslator";

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

interface HslColor {
  h: number;
  s: number;
  l: number;
}

export const parseRgbColor = (hexCode: string): RgbColor => {
  const cleanHex = hexCode.replace('#', '');

  return {
    r: parseInt(cleanHex.substring(0, 2), 16),
    g: parseInt(cleanHex.substring(2, 4), 16),
    b: parseInt(cleanHex.substring(4, 6), 16),
  };
}

export const toHexadecimal = (rgb: RgbColor) => {
  const toColorHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toColorHex(rgb.r)}${toColorHex(rgb.g)}${toColorHex(rgb.b)}`.toUpperCase();
};

/**
 * Blends two hex colors together by a percentage.
 * weight = 0 returns colorA, weight = 1 returns colorB, 0.5 is midpoint.
 */
export const blendHex = (colorA: RgbColor, colorB: RgbColor, weight: number = 0.5): string => {
  // Weighted Average
  const r = Math.round(colorA.r * (1 - weight) + colorB.r * weight);
  const g = Math.round(colorA.g * (1 - weight) + colorB.g * weight);
  const b = Math.round(colorA.b * (1 - weight) + colorB.b * weight);

  return toHexadecimal({ r, g, b });
};

export const distanceVec = (colorA: RgbColor, colorB: RgbColor): RgbColor => ({
  r: colorB.r - colorA.r,
  g: colorB.g - colorA.g,
  b: colorB.b - colorA.b,
});

export const norm = (color: RgbColor) =>
  Math.sqrt(
    Math.pow(color.r, 2) +
    Math.pow(color.g, 2) +
    Math.pow(color.b, 2)
  );

export const distance = (colorA: RgbColor, colorB: RgbColor) => norm(distanceVec(colorA, colorB))

export const rgbToHsl = (rgb: RgbColor): HslColor => {
  const converted = new ColorTranslator({
    R: rgb.r,
    G: rgb.g,
    B: rgb.b,
  }, { anglesUnit: "deg" }).HSLObject;

  return { h: converted.H, s: converted.S, l: converted.L };
}

export const hslToRgb = (hsl: HslColor): RgbColor => {
  const converted = new ColorTranslator({
    H: hsl.h,
    S: hsl.s,
    L: hsl.l,
  }, { decimals: 0, anglesUnit: "deg" }).RGBObject;

  return { r: converted.R, g: converted.G, b: converted.B };
}

