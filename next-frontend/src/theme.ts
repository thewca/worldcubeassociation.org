import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";
import { oklch, toGamut, formatHex, parseHex, lerp } from "culori";
import _ from "lodash";
import type { Rgb, Oklch } from "culori";

interface WcaPaletteInput {
  primary: string; // 1A (Solid / Top Face)
  pantoneDescription: string;
  secondaryLight: string; // 2B (Pastel)
  secondaryMedium: string; // 2C (Bright)
  secondaryDark: string; // 2A (Deep)
  cubeLight: string; // Left Face
  cubeDark: string; // Right Face
}

type LuminanceKey =
  | "50"
  | "100"
  | "200"
  | "300"
  | "400"
  | "500"
  | "600"
  | "700"
  | "800"
  | "900"
  | "950";

type ColorScale = Readonly<Record<LuminanceKey, string>>;
type ChakraColorScale = Readonly<Record<LuminanceKey, { value: string }>>;

type ColorDelta = Readonly<Oklch> & { h: number };

const slateColors = {
  green: {
    primary: "#029347",
    pantoneDescription: "Pantone 348 C",
    secondaryLight: "#C1E6CD",
    secondaryMedium: "#00FF7F",
    secondaryDark: "#1B4D3E",
    cubeLight: "#1AB55C",
    cubeDark: "#04632D",
  } satisfies WcaPaletteInput,
  white: {
    primary: "#EEEEEE",
    pantoneDescription: "Pantone Cool Gray 1 C",
    secondaryLight: "#E0DDD5",
    secondaryMedium: "#F4F1ED",
    secondaryDark: "#3B3B3B",
    cubeLight: "#FFFFFF",
    cubeDark: "#CCCCCC",
  } satisfies WcaPaletteInput,
  red: {
    primary: "#C62535",
    pantoneDescription: "Pantone 1797 C",
    secondaryLight: "#F6C5C5",
    secondaryMedium: "#FF6B6B",
    secondaryDark: "#7A1220",
    cubeLight: "#E53841",
    cubeDark: "#A3131A",
  } satisfies WcaPaletteInput,
  yellow: {
    primary: "#FFD313",
    pantoneDescription: "Pantone 116 C",
    secondaryLight: "#FFF5B8",
    secondaryMedium: "#FFF5AA",
    secondaryDark: "#664D00",
    cubeLight: "#FFDE55",
    cubeDark: "#CEA705",
  } satisfies WcaPaletteInput,
  blue: {
    primary: "#0051BA",
    pantoneDescription: "Pantone 293 C",
    secondaryLight: "#99C7FF",
    secondaryMedium: "#42D0FF",
    secondaryDark: "#003366",
    cubeLight: "#066AC4",
    cubeDark: "#03458C",
  } satisfies WcaPaletteInput,
  orange: {
    primary: "#FF5800",
    pantoneDescription: "Pantone Orange 021 C",
    secondaryLight: "#FFD5BD",
    secondaryMedium: "#FFD59E",
    secondaryDark: "#7A2B00",
    cubeLight: "#F96E32",
    cubeDark: "#D34405",
  } satisfies WcaPaletteInput,
} as const;

// From within Chakra, we assume that the RGB codes are always "correct".
const hexToRgb = (hexCode: string) => parseHex(hexCode)!;
const rgbToHex = (rgb: Rgb) => formatHex(rgb).toUpperCase();

const rgbToOklch = (rgb: Rgb): Oklch => oklch(rgb);
const oklchToRgb = toGamut("rgb", "oklch");

const getHueDelta = (sourceH: number = 0, targetH: number = 0): number =>
  ((targetH - sourceH + 540) % 360) - 180;

const calculateDelta = (source: Oklch, target: Oklch): ColorDelta => ({
  mode: "oklch",
  l: target.l - source.l,
  c: target.c - source.c,
  h: getHueDelta(source.h, target.h),
});

const typedKeys = <K extends string, V>(object: Record<K, V>): K[] =>
  Object.keys(object).filter((k): k is K => k in object);

const getSortedKeys = (scale: ColorScale): ReadonlyArray<LuminanceKey> =>
  typedKeys(scale).toSorted((a, b) => parseInt(a) - parseInt(b));

const findNearestSlotKey = (
  scale: ColorScale,
  targetOklch: Oklch,
): LuminanceKey => {
  const keys = typedKeys(scale);

  const bestKey = _.minBy(keys, (key) => {
    const currentOklch = rgbToOklch(hexToRgb(scale[key]));
    return Math.abs(currentOklch.l - targetOklch.l);
  });

  // ColorScale is never empty, so the `minBy` above is safe
  return bestKey!;
};

const generateSequence = (
  start: number,
  end: number,
): ReadonlyArray<number> => {
  const length = Math.abs(end - start);
  const step = end > start ? 1 : -1;

  return Array.from({ length }, (_, i) => start + i * step);
};

const createAnchorMap = (
  baseScale: ColorScale,
  colors: ReadonlyArray<string>,
): Readonly<Record<LuminanceKey, string>> => {
  const sortedScaleKeys = getSortedKeys(baseScale);
  const maxIdx = sortedScaleKeys.length;

  const sortedInputs = colors.toSorted((a, b) => {
    const lA = rgbToOklch(hexToRgb(a)).l;
    const lB = rgbToOklch(hexToRgb(b)).l;

    return lB - lA; // Descending Lightness
  });

  return sortedInputs.reduce(
    (assignments, color) => {
      const colorOklch = rgbToOklch(hexToRgb(color));
      const idealKey = findNearestSlotKey(baseScale, colorOklch);
      const idealIdx = sortedScaleKeys.indexOf(idealKey);

      const searchPath = [
        idealIdx,
        ...generateSequence(idealIdx + 1, maxIdx),
        ...generateSequence(idealIdx - 1, -1),
      ];

      const foundIdx = searchPath.find((idx) => {
        const key = sortedScaleKeys[idx];
        return !(key in assignments);
      });

      if (foundIdx === undefined) return assignments;

      const foundKey = sortedScaleKeys[foundIdx];
      return { ...assignments, [foundKey]: color };
    },
    {} as Record<LuminanceKey, string>,
  );
};

const getInterpolatedDelta = (
  currentIdx: number,
  sortedKeys: ReadonlyArray<string>,
  anchorIndices: ReadonlyArray<number>,
  anchorDeltas: Readonly<Record<string, ColorDelta>>,
): { delta: ColorDelta; distanceToAnchor: number } => {
  const nextAnchorPtr = anchorIndices.findIndex((idx) => idx >= currentIdx);

  if (nextAnchorPtr === 0) {
    const anchorIdx = anchorIndices[0];

    return {
      delta: anchorDeltas[sortedKeys[anchorIdx]],
      distanceToAnchor: Math.abs(currentIdx - anchorIdx),
    };
  }

  if (nextAnchorPtr === -1) {
    const anchorIdx = anchorIndices[anchorIndices.length - 1];

    return {
      delta: anchorDeltas[sortedKeys[anchorIdx]],
      distanceToAnchor: Math.abs(currentIdx - anchorIdx),
    };
  }

  const idxPrev = anchorIndices[nextAnchorPtr - 1];
  const idxNext = anchorIndices[nextAnchorPtr];

  const deltaPrev = anchorDeltas[sortedKeys[idxPrev]];
  const deltaNext = anchorDeltas[sortedKeys[idxNext]];

  const t = (currentIdx - idxPrev) / (idxNext - idxPrev);

  const interpolatedDelta = {
    mode: "oklch",
    l: lerp(deltaPrev.l, deltaNext.l, t),
    c: lerp(deltaPrev.c, deltaNext.c, t),
    h: lerp(deltaPrev.h, deltaNext.h, t),
  } as const;

  const distanceToAnchor = Math.min(
    Math.abs(currentIdx - idxPrev),
    Math.abs(currentIdx - idxNext),
  );

  return { delta: interpolatedDelta, distanceToAnchor };
};

type AdjustmentConfig = {
  readonly strength?: number;
  readonly baseInfluence?: number;
  readonly sigma?: number;
};

const adjustScale = (
  baseScale: ColorScale,
  anchors: Readonly<Record<LuminanceKey, string>>,
  config: AdjustmentConfig = {},
): ColorScale => {
  const sortedKeys = getSortedKeys(baseScale);

  const anchorData = Object.entries(anchors)
    .map(([key, targetHex]) => {
      const sourceHex = baseScale[key as LuminanceKey];

      const src = rgbToOklch(hexToRgb(sourceHex));
      const tgt = rgbToOklch(hexToRgb(targetHex));

      return {
        key,
        idx: sortedKeys.indexOf(key as LuminanceKey),
        delta: calculateDelta(src, tgt),
      };
    })
    .sort((a, b) => a.idx - b.idx);

  if (anchorData.length === 0) return baseScale;

  const anchorIndices = anchorData.map((d) => d.idx);
  const anchorDeltas = Object.fromEntries(
    anchorData.map((d) => [d.key, d.delta]),
  );

  return _.mapValues(baseScale, (hex, key) => {
    const currentIdx = sortedKeys.indexOf(key as LuminanceKey);
    const sourceOklch = rgbToOklch(hexToRgb(hex));

    const { delta: rawDelta, distanceToAnchor } = getInterpolatedDelta(
      currentIdx,
      sortedKeys,
      anchorIndices,
      anchorDeltas,
    );

    const {
      strength = 1.0 / Object.entries(anchors).length,
      baseInfluence = 0,
      sigma,
    } = config;

    const decayFactor =
      sigma !== undefined
        ? Math.exp(-(distanceToAnchor * distanceToAnchor) / (2 * sigma * sigma))
        : 1.0;
    const effectiveStrength = lerp(baseInfluence, strength, decayFactor);

    const newOklch = {
      mode: "oklch",
      l: Math.max(
        0,
        Math.min(1, sourceOklch.l + rawDelta.l * effectiveStrength),
      ),
      c: Math.max(0, sourceOklch.c + rawDelta.c * effectiveStrength),
      h: (sourceOklch.h || 0) + rawDelta.h * effectiveStrength,
    } as const;

    return rgbToHex(oklchToRgb(newOklch));
  });
};

const deriveLuminanceScale = (
  chakraRefScheme: string,
  colorScheme: WcaPaletteInput,
): ChakraColorScale => {
  // Chakra is not very friendly about exporting its pre-defined schemes and tokens…
  const modelScheme = defaultConfig.theme?.tokens?.colors?.[
    chakraRefScheme
  ] as unknown as ChakraColorScale;
  const baseScale = _.mapValues(
    modelScheme,
    (chakraToken) => chakraToken.value,
  );

  const secondaryAnchors = createAnchorMap(baseScale, [
    colorScheme.secondaryDark,
    colorScheme.secondaryMedium,
    colorScheme.secondaryLight,
  ]);

  const ambientScale = adjustScale(baseScale, secondaryAnchors, { sigma: 1.5 });

  const primaryAnchors = createAnchorMap(baseScale, [colorScheme.primary]);
  const heroScale = adjustScale(ambientScale, primaryAnchors, { sigma: 2.5 });

  return _.mapValues(heroScale, (rgbHex) => ({ value: rgbHex }));
};

const compileColorScheme = (baseColor: string) => ({
  cubeShades: {
    left: { value: `{colors.${baseColor}.lighter}` },
    top: { value: `{colors.${baseColor}.1A}` },
    right: { value: `{colors.${baseColor}.darker}` },
  },
});

const defineColorAliases = (colorPalette: WcaPaletteInput) => ({
  "1A": { value: colorPalette.primary },
  "2A": { value: colorPalette.secondaryDark },
  "2B": { value: colorPalette.secondaryLight },
  "2C": { value: colorPalette.secondaryMedium },
  lighter: { value: colorPalette.cubeLight },
  darker: { value: colorPalette.cubeDark },
});

const customConfig = defineConfig({
  theme: {
    tokens: {
      colors: {
        wcaWhite: {
          ...defineColorAliases(slateColors.white),
          ...deriveLuminanceScale("gray", slateColors.white),
        },
        green: {
          ...defineColorAliases(slateColors.green),
          ...deriveLuminanceScale("green", slateColors.green),
        },
        red: {
          ...defineColorAliases(slateColors.red),
          ...deriveLuminanceScale("red", slateColors.red),
        },
        yellow: {
          ...defineColorAliases(slateColors.yellow),
          ...deriveLuminanceScale("yellow", slateColors.yellow),
        },
        blue: {
          ...defineColorAliases(slateColors.blue),
          ...deriveLuminanceScale("blue", slateColors.blue),
        },
        orange: {
          ...defineColorAliases(slateColors.orange),
          ...deriveLuminanceScale("orange", slateColors.orange),
        },
        // Interpolated gray scale, anchored at the `supplementary.bg` values.
        // There is an additional added "zinc" nudge on the blue channel,
        //   which it seems most modern UI frameworks do.
        gray: {
          50: { value: "#FCFCFC", description: "Supplementary Bg White" },
          100: { value: "#F4F4F2" },
          200: { value: "#EDEDE9", description: "Supplementary Bg Light" },
          300: { value: "#DCDCD6", description: "Supplementary Bg Medium" },
          400: { value: "#B8B8B0", description: "Supplementary Bg Dark" },
          500: { value: "#85857D" },
          600: { value: "#5D5D57" },
          700: { value: "#454540" },
          800: { value: "#272723" },
          900: { value: "#181816" },
          950: { value: "#111111" },
        },
        supplementary: {
          text: {
            white: { value: "#FCFCFC" },
            light: { value: "#6B6B6B" },
            dark: { value: "#3B3B3B" },
            black: { value: "#1E1E1E" },
          },
          bg: {
            white: { value: "#FCFCFC" },
            light: { value: "#EDEDED" },
            medium: { value: "#DCDCDC" },
            dark: { value: "#B8B8B8" },
          },
          link: {
            DEFAULT: { value: "#0051BA" },
            lighter: { value: "#6B93E0" },
          },
        },
      },
    },
    semanticTokens: {
      colors: {
        link: {
          DEFAULT: {
            value: {
              _light: "{colors.supplementary.link}",
              _dark: "{colors.supplementary.link.lighter}",
            },
          },
          fg: { value: "{colors.link}" },
        },
        advancing: { value: "{colors.green.1A}" },
        advancingQuestionable: { value: "{colors.yellow.1A}" },
        recordMarkers: {
          personal: { value: "{colors.orange.1A}" },
          national: { value: "{colors.green.1A}" },
          continental: { value: "{colors.red.1A}" },
          world: { value: "{colors.blue.1A}" },
        },
        green: compileColorScheme("green"),
        white: compileColorScheme("wcaWhite"),
        red: compileColorScheme("red"),
        yellow: compileColorScheme("yellow"),
        blue: compileColorScheme("blue"),
        orange: compileColorScheme("orange"),
        black: {
          // not a full color scheme, only the necessary colors for badges
          subtle: { value: "{colors.supplementary.text.dark}" },
          cubeShades: {
            left: { value: "#282828" },
            top: { value: "#3B3B3B" },
            right: { value: "#6B6B6B" },
          },
        },
      },
      radii: {
        wca: { value: "10px" },
      },
    },
    textStyles: {
      h1: {
        value: {
          fontSize: "3rem",
          lineHeight: "3.75rem",
          fontWeight: "extrabold",
          textTransform: "uppercase",
        },
      },
      h2: {
        value: {
          fontSize: "2.25rem",
          lineHeight: "2.75rem",
          fontWeight: "extrabold",
        },
      },
      h3: {
        value: {
          fontSize: "1.6875rem",
          lineHeight: "2.25rem",
          fontWeight: "extrabold",
        },
      },
      s1: {
        value: {
          fontSize: "1.125rem",
          lineHeight: "1.75rem",
          fontWeight: "bold",
        },
      },
      s2: {
        value: {
          fontSize: "1.125rem",
          lineHeight: "1.75rem",
          fontWeight: "medium",
        },
      },
      s3: {
        value: {
          fontSize: "1.125rem",
          lineHeight: "1.75rem",
          fontWeight: "bold",
          textTransform: "uppercase",
        },
      },
      s4: {
        value: {
          fontSize: "1rem",
          lineHeight: "1.5rem",
          fontWeight: "medium",
          textTransform: "uppercase",
          letterSpacing: "wider",
        },
      },
      body: {
        value: {
          fontSize: "0.875rem",
          lineHeight: "1.25rem",
          fontWeight: "light",
        },
      },
      bodyEmphasis: {
        value: {
          fontSize: "0.875rem",
          lineHeight: "1.25rem",
          fontWeight: "medium",
        },
      },
      annotation: {
        value: {
          fontSize: "0.6875rem",
          lineHeight: "0.825rem",
          fontWeight: "light",
          // fontStyle: "italic",
        },
      },
      quote: {
        value: {
          fontSize: "1rem",
          lineHeight: "1.5rem",
          fontWeight: "light",
          fontStyle: "italic",
        },
      },
      hyperlink: {
        value: {
          fontSize: "0.875rem",
          lineHeight: "1.25rem",
          fontWeight: "medium",
          color: "link",
        },
      },
      headerLink: {
        value: {
          fontSize: "1rem",
          lineHeight: "1.5rem",
          fontWeight: "medium",
          color: "currentColor",
        },
      },
    },
    layerStyles: {
      "card.dark": {
        value: {
          background: "colorPalette.2A",
          color: "colorPalette.2B",
        },
      },
      "card.pastel": {
        value: {
          background: "colorPalette.1A",
          color: "colorPalette.contrast",
        },
      },
      "card.bright": {
        value: {
          background: "colorPalette.2C",
          color: "colorPalette.2A",
        },
      },
    },
    recipes: {
      link: {
        base: {
          colorPalette: "link",
          textStyle: "hyperlink",
        },
      },
      text: {
        base: {
          textStyle: "body",
        },
      },
    },
    slotRecipes: {
      dataList: {
        slots: [],
        variants: {
          iconLabel: {
            true: {
              itemLabel: {
                minWidth: "6",
                justifyContent: "end",
                color: "fg",
              },
            },
          },
        },
      },
      stat: {
        slots: [],
        variants: {
          variant: {
            competition: {
              label: {
                alignItems: "start",
                textStyle: "annotation",
              },
              valueText: {
                textStyle: "bodyEmphasis",
              },
            },
          },
        },
      },
      card: {
        slots: [],
        base: {
          root: {
            borderRadius: "wca",
          },
          body: {
            gap: "4",
          },
        },
        variants: {
          variant: {
            info: {
              root: {
                bg: "bg.muted",
                borderWidth: "1px",
                borderColor: "border",
              },
            },
          },
          colorVariant: {
            solid: {
              root: {
                colorPalette: "white",
                layerStyle: "fill.solid",
              },
              description: {
                layerStyle: "fill.solid",
              },
            },
            muted: {
              root: {
                colorPalette: "white",
                layerStyle: "fill.muted",
              },
              description: {
                layerStyle: "fill.muted",
              },
            },
            surface: {
              root: {
                colorPalette: "white",
                layerStyle: "fill.surface",
              },
              description: {
                layerStyle: "fill.subtle",
              },
            },
          },
        },
        defaultVariants: {
          // @ts-expect-error TypeScript does not know about the new variant before compiling the theme further down below
          variant: "info",
        },
      },
      accordion: {
        slots: [],
        base: {
          root: {
            "--accordion-radius": "{radii.wca}",
          },
        },
        variants: {
          variant: {
            card: {
              root: {
                spaceY: "4",
                overflow: "hidden",
                "--accordion-padding-x": "spacing.6",
                "--accordion-padding-y": "spacing.3",
              },
              itemTrigger: {
                px: "var(--accordion-padding-x)",
              },
              itemContent: {
                px: "var(--accordion-padding-x)",
              },
              item: {
                borderRadius: "l3",
              },
            },
          },
        },
      },
      table: {
        slots: [],
        variants: {
          variant: {
            competitions: {
              root: {
                tableLayout: "auto",
              },
              cell: {
                whiteSpace: "noWrap",
              },
              row: {
                cursor: "pointer",
                "& td": {
                  transitionProperty: "background-color",
                  transitionTimingFunction: "ease",
                  transitionDuration: "150ms",
                },
                "&:nth-of-type(odd) td": {
                  bg: "bg.subtle",
                },
                "&:hover td": {
                  bg: "colorPalette.fg/60",
                },
              },
            },
          },
          size: {
            // This is following the template of other `size` definitions
            //   straight from the Chakra source code
            xs: {
              root: {
                textStyle: "sm",
              },
              columnHeader: {
                px: "1",
                py: "1",
              },
              cell: {
                px: "1.5",
                py: "1.5",
              },
            },
          },
        },
      },
      tabs: {
        slots: [],
        variants: {
          highContrast: {
            true: {
              trigger: {
                _selected: {
                  color: "colorPalette.contrast",
                },
              },
            },
          },
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, customConfig);
