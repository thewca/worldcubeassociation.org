import { differenceEuclidean, interpolate, oklch, Rgb, Oklch, toGamut, formatHex, parseHex } from "culori";

export const parseRgbColor = (hexCode: string) => parseHex(hexCode)!;

export const toHexadecimal = (rgb: Rgb) => formatHex(rgb).toUpperCase();

export const blend = (colorA: Rgb, colorB: Rgb, weight: number = 0.5): Rgb => {
  const interpolationEngine = interpolate([colorA, colorB], "rgb");

  return interpolationEngine(weight);
};

const euclideanAlg = differenceEuclidean("rgb");

export const distance = (colorA: Rgb, colorB: Rgb) => euclideanAlg(colorA, colorB);

export const rgbToOklch = (rgb: Rgb): Oklch => {
  return oklch(rgb);
}

const toRgbGamut = toGamut('rgb', 'oklch');

export const oklchToRgb = (oklch: Oklch): Rgb => {
  return toRgbGamut(oklch);
}

