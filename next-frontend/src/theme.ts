import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";
import { oklch, toGamut, formatHex, parseHex, lerp } from "culori";
import _ from "lodash";
import type { Rgb, Oklch } from "culori";

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

type BrandRole = "1A" | "2A";

type RoleRungs = Readonly<Record<BrandRole, LuminanceKey>>;

// The two brand colours are *positions on the scale*, not free-standing
//   colours: `deriveLuminanceScale` bends the generated ladder to pass through
//   them. Solid normally lands on 600 and Deep on 800; families whose Solid
//   cannot sit at 600 name their own rung, and their `solid` semantic token is
//   repointed to match so `colorPalette.solid` stays the brand colour.
const slateRoleRungs = {
  // Gamut exception: the Solid is a near-white, so it can only sit at 100.
  wcaWhite: { "2A": "800", "1A": "100" },
  green: { "2A": "800", "1A": "600" },
  red: { "2A": "800", "1A": "600" },
  // Gamut exception: no screen can show a yellow this vivid below L≈0.80,
  //   so the Solid sits at 400.
  yellow: { "2A": "800", "1A": "400" },
  blue: { "2A": "800", "1A": "700" },
  orange: { "2A": "800", "1A": "500" },
} as const satisfies Readonly<Record<string, RoleRungs>>;

interface WcaPaletteInput {
  primary: string; // 1A (Solid / Top Face)
  pantoneDescription: string;
  secondaryDark: string; // 2A (Deep)
  cubeLight: string; // Left Face
  cubeDark: string; // Right Face
  rungs: RoleRungs;
}

type ColorScale = Readonly<Record<LuminanceKey, string>>;
type ChakraColorScale = Readonly<Record<LuminanceKey, { value: string }>>;

// Chakra styles these trigger slots without ever setting `cursor`, so
// they fall back to the browser default and read as non-interactive.
// We should be able to override them in the cursor tokens, but this is currently not supported in chakra.
// https://github.com/chakra-ui/chakra-ui/issues/10960
const INTERACTIVITY_OVERRIDES = {
  menu: {
    slots: [],
    base: {
      trigger: {
        cursor: "pointer",
        _disabled: { cursor: "disabled" },
      },
    },
  },
  select: {
    slots: [],
    base: {
      trigger: {
        cursor: "pointer",
        _disabled: { cursor: "disabled" },
      },
    },
  },
  combobox: {
    slots: [],
    base: {
      trigger: {
        cursor: "pointer",
        _disabled: { cursor: "disabled" },
      },
    },
  },
  popover: {
    slots: [],
    base: {
      trigger: {
        cursor: "pointer",
        _disabled: { cursor: "disabled" },
      },
    },
  },
  collapsible: {
    slots: [],
    base: {
      trigger: {
        cursor: "pointer",
        _disabled: { cursor: "disabled" },
      },
    },
  },
  steps: {
    slots: [],
    base: {
      trigger: {
        cursor: "pointer",
        _disabled: { cursor: "disabled" },
      },
    },
  },
  checkboxCard: {
    slots: [],
    base: {
      root: {
        cursor: "pointer",
        _disabled: { cursor: "disabled" },
      },
    },
  },
  radioCard: {
    slots: [],
    base: {
      item: {
        cursor: "pointer",
        _disabled: { cursor: "disabled" },
      },
    },
  },
  segmentGroup: {
    slots: [],
    base: {
      item: {
        cursor: "pointer",
        _disabled: { cursor: "disabled" },
      },
    },
  },
  // The `cursor.slider` token exists but the slider recipe never consumes
  // it, so the thumb needs its own rule.
  slider: {
    slots: [],
    base: {
      thumb: {
        cursor: "grab",
        _dragging: { cursor: "grabbing" },
        _disabled: { cursor: "disabled" },
      },
    },
  },
};

const slateColors = {
  green: {
    primary: "#029347",
    pantoneDescription: "Pantone 348 C",
    secondaryDark: "#1B4D3E",
    cubeLight: "#1AB55C",
    cubeDark: "#04632D",
    rungs: slateRoleRungs.green,
  } satisfies WcaPaletteInput,
  white: {
    primary: "#EEEEEE",
    pantoneDescription: "Pantone Cool Gray 1 C",
    secondaryDark: "#3B3B3B",
    cubeLight: "#FFFFFF",
    cubeDark: "#CCCCCC",
    rungs: slateRoleRungs.wcaWhite,
  } satisfies WcaPaletteInput,
  red: {
    primary: "#C62535",
    pantoneDescription: "Pantone 1797 C",
    secondaryDark: "#7A1220",
    cubeLight: "#E53841",
    cubeDark: "#A3131A",
    rungs: slateRoleRungs.red,
  } satisfies WcaPaletteInput,
  yellow: {
    primary: "#FFD313",
    pantoneDescription: "Pantone 116 C",
    secondaryDark: "#664D00",
    cubeLight: "#FFDE55",
    cubeDark: "#CEA705",
    rungs: slateRoleRungs.yellow,
  } satisfies WcaPaletteInput,
  blue: {
    primary: "#0051BA",
    pantoneDescription: "Pantone 293 C",
    secondaryDark: "#003366",
    cubeLight: "#066AC4",
    cubeDark: "#03458C",
    rungs: slateRoleRungs.blue,
  } satisfies WcaPaletteInput,
  orange: {
    primary: "#FF5800",
    pantoneDescription: "Pantone Orange 021 C",
    secondaryDark: "#7A2B00",
    cubeLight: "#F96E32",
    cubeDark: "#D34405",
    rungs: slateRoleRungs.orange,
  } satisfies WcaPaletteInput,
} as const;

// From within Chakra, we assume that the RGB codes are always "correct".
const hexToRgb = (hexCode: string) => parseHex(hexCode)!;
const rgbToHex = (rgb: Rgb) => formatHex(rgb).toUpperCase();

const rgbToOklch = (rgb: Rgb): Oklch => oklch(rgb);
const oklchToRgb = toGamut("rgb", "oklch");

const SCALE_KEYS = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
  "950",
] as const satisfies ReadonlyArray<LuminanceKey>;

type Anchor = { readonly idx: number; readonly color: Oklch };

// Chakra is not very friendly about exporting its pre-defined schemes and tokens…
const readChakraScale = (chakraRefScheme: string): ReadonlyArray<Oklch> => {
  const modelScheme = defaultConfig.theme?.tokens?.colors?.[
    chakraRefScheme
  ] as unknown as ChakraColorScale;

  return SCALE_KEYS.map((key) => rgbToOklch(hexToRgb(modelScheme[key].value)));
};

// Locates the two anchors bracketing `idx`, together with how far between them
//   it sits. Positions outside the anchored range clamp onto the nearest one,
//   so a scale never extrapolates past a colour we were actually given.
const findSegment = (anchors: ReadonlyArray<Anchor>, idx: number) => {
  const upperPtr = anchors.findIndex((anchor) => anchor.idx >= idx);
  const upper = upperPtr < 1 ? 1 : upperPtr;

  const [lighter, darker] = [anchors[upper - 1], anchors[upper]];
  const span = darker.idx - lighter.idx;

  return {
    lighter,
    darker,
    position: span === 0 ? 0 : _.clamp((idx - lighter.idx) / span, 0, 1),
  };
};

// Rescales the reference ladder so it passes exactly through the brand anchors,
//   preserving the relative spacing Chakra tuned between them.
const remapLightness = (
  reference: ReadonlyArray<Oklch>,
  anchors: ReadonlyArray<Anchor>,
  idx: number,
): number => {
  const { lighter, darker } = findSegment(anchors, idx);

  const refSpan = reference[lighter.idx].l - reference[darker.idx].l;
  const position =
    refSpan === 0
      ? 0
      : _.clamp((reference[idx].l - reference[darker.idx].l) / refSpan, 0, 1);

  return lerp(darker.color.l, lighter.color.l, position);
};

// Chroma keeps the reference curve's shape (it peaks mid-scale rather than
//   running monotonically), scaled to meet the brand anchors' colourfulness.
const remapChroma = (
  reference: ReadonlyArray<Oklch>,
  anchors: ReadonlyArray<Anchor>,
  idx: number,
): number => {
  const { lighter, darker, position } = findSegment(anchors, idx);

  const ratioAt = (anchor: Anchor) =>
    reference[anchor.idx].c === 0
      ? 0
      : anchor.color.c / reference[anchor.idx].c;

  return reference[idx].c * lerp(ratioAt(lighter), ratioAt(darker), position);
};

// Hue travels the shortest arc between the anchors, so the family holds the
//   Solid's hue across the light half and settles onto the Deep tone's own hue
//   at the bottom, instead of wandering wherever the reference scale went.
const remapHue = (anchors: ReadonlyArray<Anchor>, idx: number): number => {
  const { lighter, darker, position } = findSegment(anchors, idx);

  const from = lighter.color.h ?? darker.color.h ?? 0;
  const to = darker.color.h ?? from;
  const arc = ((to - from + 540) % 360) - 180;

  return from + arc * position;
};

const deriveLuminanceScale = (
  chakraRefScheme: string,
  colorScheme: WcaPaletteInput,
): ChakraColorScale => {
  const reference = readChakraScale(chakraRefScheme);
  const lastIdx = SCALE_KEYS.length - 1;

  const solid = rgbToOklch(hexToRgb(colorScheme.primary));
  const deep = rgbToOklch(hexToRgb(colorScheme.secondaryDark));

  const solidIdx = SCALE_KEYS.indexOf(colorScheme.rungs["1A"]);
  const deepIdx = SCALE_KEYS.indexOf(colorScheme.rungs["2A"]);

  // The two brand colours we keep verbatim pin hue and chroma. Lightness gets
  //   the endpoints as extra anchors, so the extremes stay where Chakra put
  //   them and remain usable as page surfaces.
  const brandAnchors: ReadonlyArray<Anchor> = [
    { idx: solidIdx, color: solid },
    { idx: deepIdx, color: deep },
  ];

  const lightnessAnchors: ReadonlyArray<Anchor> = _.sortBy(
    [
      { idx: 0, color: reference[0] },
      ...brandAnchors,
      { idx: lastIdx, color: reference[lastIdx] },
    ],
    "idx",
  );

  const scale = Object.fromEntries(
    SCALE_KEYS.map((key, idx) => [
      key,
      rgbToHex(
        oklchToRgb({
          mode: "oklch",
          l: remapLightness(reference, lightnessAnchors, idx),
          c: remapChroma(reference, brandAnchors, idx),
          h: remapHue(brandAnchors, idx),
        }),
      ),
    ]),
  ) as ColorScale;

  return _.mapValues(scale, (rgbHex) => ({ value: rgbHex }));
};

// Everything a palette needs beyond the generated ladder: the three cube faces,
//   which are brand artwork rather than a rung of any scale.
const buildPalette = (
  chakraRefScheme: string,
  colorPalette: WcaPaletteInput,
) => ({
  ...deriveLuminanceScale(chakraRefScheme, colorPalette),
  cubeShades: {
    left: { value: colorPalette.cubeLight },
    top: { value: colorPalette.primary },
    right: { value: colorPalette.cubeDark },
  },
});

// Chakra aims each palette's `solid` token at rung 600. Families whose brand
//   Solid sits elsewhere on the ladder need it repointed, or `colorPalette.solid`
//   would render a generated neighbour instead of the Pantone-matched colour.
const brandSolid = (baseColor: keyof typeof slateRoleRungs) => ({
  solid: { value: `{colors.${baseColor}.${slateRoleRungs[baseColor]["1A"]}}` },
});

const customConfig = defineConfig({
  theme: {
    tokens: {
      colors: {
        wcaWhite: buildPalette("gray", slateColors.white),
        green: buildPalette("green", slateColors.green),
        red: buildPalette("red", slateColors.red),
        yellow: buildPalette("yellow", slateColors.yellow),
        blue: buildPalette("blue", slateColors.blue),
        orange: buildPalette("orange", slateColors.orange),
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
      cursor: {
        menuitem: { value: "pointer" },
        checkbox: { value: "pointer" },
        radio: { value: "pointer" },
        option: { value: "pointer" },
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
        recordMarkers: {
          personal: { value: "{colors.orange.solid}" },
          national: { value: "{colors.green.solid}" },
          continental: { value: "{colors.red.solid}" },
          world: { value: "{colors.blue.solid}" },
        },
        wcaWhite: {
          // values mostly stolen from Chakra's `gray` scale,
          // with a minor adjustment for the `solid` entry.
          contrast: {
            value: { _light: "{colors.white}", _dark: "{colors.black}" },
          },
          fg: {
            value: {
              _light: "{colors.wcaWhite.800}",
              _dark: "{colors.wcaWhite.200}",
            },
          },
          subtle: {
            value: {
              _light: "{colors.wcaWhite.100}",
              _dark: "{colors.wcaWhite.900}",
            },
          },
          muted: {
            value: {
              _light: "{colors.wcaWhite.200}",
              _dark: "{colors.wcaWhite.800}",
            },
          },
          emphasized: {
            value: {
              _light: "{colors.wcaWhite.300}",
              _dark: "{colors.wcaWhite.700}",
            },
          },
          solid: {
            value: {
              _light: "{colors.wcaWhite.900}",
              _dark: "{colors.wcaWhite.50}",
            },
          },
          focusRing: {
            value: {
              _light: "{colors.wcaWhite.400}",
              _dark: "{colors.wcaWhite.400}",
            },
          },
          border: {
            value: {
              _light: "{colors.wcaWhite.200}",
              _dark: "{colors.wcaWhite.800}",
            },
          },
        },
        // green and red already have their brand Solid on rung 600, so Chakra's
        //   own `solid` token points at the right colour without help.
        yellow: brandSolid("yellow"),
        blue: brandSolid("blue"),
        orange: {
          ...brandSolid("orange"),
          // Chakra pairs orange with white in light mode, which only reaches
          //   3.16:1 on the brand orange. Black clears AA at 6.65:1, and is
          //   already what Chakra does for yellow in both modes.
          contrast: { value: "black" },
        },
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
          lineHeight: "1.2",
          fontWeight: "extrabold",
          textTransform: "uppercase",
        },
      },
      h2: {
        value: {
          fontSize: "2.25rem",
          lineHeight: "1.25",
          fontWeight: "extrabold",
        },
      },
      h3: {
        value: {
          fontSize: "1.6875rem",
          lineHeight: "calc(4/3)",
          fontWeight: "extrabold",
        },
      },
      s1: {
        value: {
          fontSize: "1.125rem",
          lineHeight: "1.5",
          fontWeight: "bold",
        },
      },
      s2: {
        value: {
          fontSize: "1.125rem",
          lineHeight: "1.5",
          fontWeight: "medium",
        },
      },
      s3: {
        value: {
          fontSize: "1.125rem",
          lineHeight: "1.5",
          fontWeight: "bold",
          textTransform: "uppercase",
        },
      },
      s4: {
        value: {
          fontSize: "1rem",
          lineHeight: "1.5",
          fontWeight: "medium",
          textTransform: "uppercase",
          letterSpacing: "wider",
        },
      },
      body: {
        value: {
          fontSize: "0.875rem",
          lineHeight: "1.5",
          fontWeight: "normal",
        },
      },
      bodyEmphasis: {
        value: {
          fontSize: "0.875rem",
          lineHeight: "1.5",
          fontWeight: "medium",
        },
      },
      annotation: {
        value: {
          fontSize: "0.6875rem",
          lineHeight: "1.2",
          fontWeight: "light",
          // fontStyle: "italic",
        },
      },
      quote: {
        value: {
          fontSize: "1rem",
          lineHeight: "1.5",
          fontWeight: "light",
          fontStyle: "italic",
        },
      },
      hyperlink: {
        value: {
          fontSize: "0.875rem",
          lineHeight: "1.5",
          fontWeight: "medium",
          color: "link",
        },
      },
      headerLink: {
        value: {
          fontSize: "1rem",
          lineHeight: "1.5",
          fontWeight: "medium",
          color: "currentColor",
        },
      },
    },
    layerStyles: {
      // Chakra ships fill.subtle / fill.muted / fill.solid / fill.surface and
      //   outline.*, which is everything we were hand-rolling. `fill.emphasized`
      //   is the one rung Chakra leaves out.
      "fill.emphasized": {
        value: {
          background: "colorPalette.emphasized",
          color: "colorPalette.fg",
        },
      },
    },
    recipes: {
      container: {
        base: {
          px: { base: "3.5", md: "6", lg: "8" },
        },
      },
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
      badge: {
        variants: {
          variant: {
            achievement: {
              fontWeight: "inherit",
              paddingX: 2.5,
              gap: 3,
              "& svg": {
                fontSize: "4xl",
              },
            },
          },
        },
      },
      button: {
        variants: {
          variant: {
            // Solid button locked to the blue palette. Used on homepage cards
            // when a button should not inherit its surrounding card's color
            // scheme.
            pastelSolid: {
              colorPalette: "blue",
              bg: "colorPalette.solid",
              color: "colorPalette.contrast",
              borderColor: "transparent",
              _hover: {
                bg: "colorPalette.solid/90",
              },
              _expanded: {
                bg: "colorPalette.solid/90",
              },
            },
            // Copy of Chakra's built-in `outline` variant, but with a stronger
            // `_hover` background. Used on homepage cards when a button should
            // inherit its surrounding card's color scheme.
            pastelOutline: {
              borderWidth: "1px",
              borderColor: "colorPalette.border",
              color: "colorPalette.fg",
              _hover: {
                bg: "colorPalette.emphasized",
              },
              _expanded: {
                bg: "colorPalette.subtle",
              },
            },
            // Outline button for a `fill.solid` surface. Chakra's `outline`
            // variant colours itself from `colorPalette.fg` and
            // `colorPalette.border`, which are rungs of the same hue as
            // `colorPalette.solid` — on blue, `fg` resolves to the *same* value
            // as the background, so the button disappears entirely. Inheriting
            // `currentColor` picks up the surface's `contrast` foreground
            // instead, which reads on every palette and in both colour modes.
            onSolid: {
              borderWidth: "1px",
              borderColor: "currentColor",
              color: "currentColor",
              _hover: {
                bg: "colorPalette.contrast/15",
              },
              _expanded: {
                bg: "colorPalette.contrast/15",
              },
            },
          },
        },
      },
    },
    slotRecipes: {
      ...INTERACTIVITY_OVERRIDES,
      steps: {
        ...INTERACTIVITY_OVERRIDES.steps,
        variants: {
          orientation: {
            vertical: {
              // Chakra hangs the connector inside the step it leads out of and sizes it against
              //   that step's own height, so a step no taller than its label leaves the connector
              //   nothing to run in and it collapses to nothing.
              item: {
                _notLast: {
                  minHeight:
                    "calc(var(--steps-size) + var(--steps-gutter) * 4)",
                },
              },
              separator: {
                marginX: "0",
              },
            },
            horizontal: {
              // Responsive variants merge property by property, so anything the vertical branch
              //   sets and this one leaves alone survives into the wider breakpoint - which is
              //   what left the horizontal connector absolutely positioned, and so invisible.
              root: {
                height: "auto",
              },
              item: {
                _notLast: {
                  minHeight: "auto",
                },
              },
              separator: {
                position: "static",
                top: "auto",
                insetStart: "auto",
                maxHeight: "none",
              },
            },
          },
        },
      },
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
                colorPalette: "wcaWhite",
                layerStyle: "fill.solid",
              },
              description: {
                layerStyle: "fill.solid",
              },
            },
            muted: {
              root: {
                colorPalette: "wcaWhite",
                layerStyle: "fill.muted",
              },
              description: {
                layerStyle: "fill.muted",
              },
            },
            subtle: {
              root: {
                colorPalette: "wcaWhite",
                layerStyle: "fill.subtle",
              },
              description: {
                layerStyle: "fill.subtle",
              },
            },
            surface: {
              root: {
                colorPalette: "wcaWhite",
                layerStyle: "fill.surface",
              },
              description: {
                // using fill.surface here would apply borders _within_ the card body
                layerStyle: "fill.subtle",
              },
            },
            emphasized: {
              root: {
                colorPalette: "wcaWhite",
                layerStyle: "fill.emphasized",
              },
              description: {
                layerStyle: "fill.emphasized",
              },
            },
            deep: {
              root: {
                colorPalette: "wcaWhite",
                layerStyle: "fill.solid",
              },
              description: {
                layerStyle: "fill.solid",
              },
            },
            slatePastel: {
              root: {
                colorPalette: "wcaWhite",
                layerStyle: "fill.solid",
              },
              description: {
                layerStyle: "fill.solid",
              },
            },
          },
        },
        defaultVariants: {
          variant: "info",
        },
      },
      accordion: {
        slots: [],
        base: {
          root: {
            "--accordion-radius": "{radii.wca}",
          },
          itemTrigger: {
            cursor: "pointer",
            _disabled: {
              cursor: "disabled",
            },
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
                  bg: "colorPalette.muted",
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
      list: {
        slots: [],
        variants: {
          // Chakra's reset drops the browser's default list padding and its list recipe
          //   does not put any back, so without this the markers have nowhere to sit and
          //   the list reads as flush body text.
          indented: {
            true: {
              root: {
                ps: "6",
              },
            },
          },
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, customConfig);
