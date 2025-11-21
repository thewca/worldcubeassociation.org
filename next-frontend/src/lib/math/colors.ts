interface RgbColor {
  r: number;
  g: number;
  b: number;
}

const toRgbColor = (hexCode: string): RgbColor => {
  const cleanHex = hexCode.replace('#', '');

  return {
    r: parseInt(cleanHex.substring(0, 2), 16),
    g: parseInt(cleanHex.substring(2, 4), 16),
    b: parseInt(cleanHex.substring(4, 6), 16),
  };
}

const toHexadecimal = (rgb: RgbColor) => {
  const toColorHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toColorHex(rgb.r)}${toColorHex(rgb.g)}${toColorHex(rgb.b)}`.toUpperCase();
};

/**
 * Blends two hex colors together by a percentage.
 * weight = 0 returns color1, weight = 1 returns color2, 0.5 is midpoint.
 */
export const blendHex = (color1: string, color2: string, weight: number = 0.5): string => {
  const rgb1 = toRgbColor(color1);
  const rgb2 = toRgbColor(color2);

  // Weighted Average
  const r = Math.round(rgb1.r * (1 - weight) + rgb2.r * weight);
  const g = Math.round(rgb1.g * (1 - weight) + rgb2.g * weight);
  const b = Math.round(rgb1.b * (1 - weight) + rgb2.b * weight);

  return toHexadecimal({ r, g, b });
};
