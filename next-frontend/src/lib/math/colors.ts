import {differenceEuclidean, interpolate, oklch, toGamut, formatHex, parseHex, lerp} from "culori";
import type { Rgb, Oklch } from "culori";
import _ from "lodash";

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

export type ColorDelta = Readonly<Oklch> & { h: number; };

const getHueDelta = (sourceH: number = 0, targetH: number = 0): number =>
  ((targetH - sourceH + 540) % 360) - 180;

export const calculateDelta = (source: Oklch, target: Oklch): ColorDelta => ({
  mode: "oklch",
  l: target.l - source.l,
  c: target.c - source.c,
  h: getHueDelta(source.h, target.h)
});

export type LuminanceKey = "50" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900" | "950";
export type ColorScale = Readonly<Record<LuminanceKey, string>>;

export const typedKeys = <K extends string, V>(object: Record<K, V>): K[] => {
  return Object.keys(object).filter((k): k is K => k in object);
}

export const getSortedKeys = (scale: ColorScale): ReadonlyArray<LuminanceKey> =>
  typedKeys(scale).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

export const findNearestSlotKey = (
  scale: ColorScale,
  targetOklch: Oklch,
): string => {
  const keys = typedKeys(scale);

  const bestKey = _.minBy(keys, (key) => {
    const currentOklch = rgbToOklch(parseRgbColor(scale[key]));
    return Math.abs(currentOklch.l - targetOklch.l);
  });

  // ColorScale is never empty, so the `minBy` above is safe
  return bestKey!;
};

export const getInterpolatedDelta = (
  currentIdx: number,
  sortedKeys: ReadonlyArray<string>,
  anchorIndices: ReadonlyArray<number>,
  anchorDeltas: ReadonlyMap<string, ColorDelta>
): { delta: ColorDelta, distanceToAnchor: number } => {
  const nextAnchorPtr = anchorIndices.findIndex(idx => idx >= currentIdx);

  if (nextAnchorPtr === 0) {
    const anchorIdx = anchorIndices[0];

    return {
      delta: anchorDeltas.get(sortedKeys[anchorIdx])!,
      distanceToAnchor: Math.abs(currentIdx - anchorIdx)
    };
  }

  if (nextAnchorPtr === -1) {
    const anchorIdx = anchorIndices[anchorIndices.length - 1];

    return {
      delta: anchorDeltas.get(sortedKeys[anchorIdx])!,
      distanceToAnchor: Math.abs(currentIdx - anchorIdx)
    };
  }

  const idxPrev = anchorIndices[nextAnchorPtr - 1];
  const idxNext = anchorIndices[nextAnchorPtr];

  const deltaPrev = anchorDeltas.get(sortedKeys[idxPrev])!;
  const deltaNext = anchorDeltas.get(sortedKeys[idxNext])!;

  const t = (currentIdx - idxPrev) / (idxNext - idxPrev);

  const interpolatedDelta = {
    mode: 'oklch',
    l: lerp(deltaPrev.l, deltaNext.l, t),
    c: lerp(deltaPrev.c, deltaNext.c, t),
    h: lerp(deltaPrev.h, deltaNext.h, t)
  } as const;

  const distanceToAnchor = Math.min(
    Math.abs(currentIdx - idxPrev),
    Math.abs(currentIdx - idxNext)
  );

  return { delta: interpolatedDelta, distanceToAnchor };
};

type AdjustmentConfig = {
  readonly strength?: number;
  readonly baseInfluence?: number;
  readonly sigma?: number;
};

export const adjustScale = (
  baseScale: ColorScale,
  anchors: ReadonlyMap<string, string>,
  config: AdjustmentConfig = {},
): ColorScale => {
  const sortedKeys = getSortedKeys(baseScale);

  const anchorData = Array.from(anchors.entries())
    .map(([key, targetHex]) => {
      const sourceHex = baseScale[key];

      const src = rgbToOklch(parseRgbColor(sourceHex));
      const tgt = rgbToOklch(parseRgbColor(targetHex));

      return {
        key,
        idx: sortedKeys.indexOf(key),
        delta: calculateDelta(src, tgt),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => a.idx - b.idx);

  if (anchorData.length === 0) return baseScale;

  const anchorIndices = anchorData.map(d => d.idx);
  const anchorDeltas = new Map(anchorData.map(d => [d.key, d.delta]));

  return _.mapValues(baseScale, (hex, key) => {
    const currentIdx = sortedKeys.indexOf(key);
    const sourceOklch = rgbToOklch(parseRgbColor(hex));

    const { delta: rawDelta, distanceToAnchor } = getInterpolatedDelta(
      currentIdx, sortedKeys, anchorIndices, anchorDeltas
    );

    const {
      strength = 1.0 / anchors.size,
      baseInfluence = 0,
      sigma,
    } = config;

    const decayFactor = sigma !== undefined ? Math.exp(- (distanceToAnchor * distanceToAnchor) / (2 * sigma * sigma)) : 1.0;
    const effectiveStrength = lerp(baseInfluence, strength, decayFactor)

    const newOklch = {
      mode: 'oklch',
      l: Math.max(0, Math.min(1, sourceOklch.l + (rawDelta.l * effectiveStrength))),
      c: Math.max(0, sourceOklch.c + (rawDelta.c * effectiveStrength)),
      h: (sourceOklch.h || 0) + (rawDelta.h * effectiveStrength)
    } as const;

    return toHexadecimal(oklchToRgb(newOklch));
  });
};
