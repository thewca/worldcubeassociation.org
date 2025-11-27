import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const compileColorScheme = (baseColor: string) => ({
  cubeShades: {
    left: { value: `{colors.${baseColor}.lighter}` },
    top: { value: `{colors.${baseColor}.1A}` },
    right: { value: `{colors.${baseColor}.darker}` },
  },
  gradient: {
    default: {
      value: {
        _light: `linear-gradient(90deg, {colors.${baseColor}.fg} 0%, {colors.bg} 100%)`,
        _dark: `linear-gradient(90deg, {colors.${baseColor}.muted} 0%, {colors.bg} 100%)`,
      },
    },
    hover: {
      value: {
        _light: `linear-gradient(90deg, {colors.${baseColor}.fg/80} 0%, {colors.bg} 100%)`,
        _dark: `linear-gradient(90deg, {colors.${baseColor}.muted/80} 0%, {colors.bg} 100%)`,
      },
    },
  },
});

const defineColorAliases = (colorPalette: WcaPaletteInput) => ({
  "1A": { value: colorPalette.primary },
  "2A": { value: colorPalette.secondaryDark },
  "2B": { value: colorPalette.secondaryLight },
  "2C": { value: colorPalette.secondaryMedium },
  "lighter": { value: colorPalette.cubeLight },
  "darker": { value: colorPalette.cubeDark },
})

interface WcaPaletteInput {
  primary: string;         // 1A (Solid / Top Face)
  pantoneDescription: string;
  secondaryLight: string;  // 2B (Pastel)
  secondaryMedium: string; // 2C (Bright)
  secondaryDark: string;   // 2A (Deep)
  cubeLight: string;       // Left Face
  cubeDark: string;        // Right Face
}

const slateColors = {
  "green": {
    primary: "#029347",
    pantoneDescription: "Pantone 348 C",
    secondaryLight: "#C1E6CD",
    secondaryMedium: "#00FF7F",
    secondaryDark: "#1B4D3E",
    cubeLight: "#1AB55C",
    cubeDark: "#04632D",
  } satisfies WcaPaletteInput,
  "white": {
    primary: "#EEEEEE",
    pantoneDescription: "Pantone Cool Gray 1 C",
    secondaryLight: "#E0DDD5",
    secondaryMedium: "#F4F1ED",
    secondaryDark: "#3B3B3B",
    cubeLight: "#FFFFFF",
    cubeDark: "#CCCCCC",
  } satisfies WcaPaletteInput,
  "red": {
    primary: "#C62535",
    pantoneDescription: "Pantone 1797 C",
    secondaryLight: "#F6C5C5",
    secondaryMedium: "#FF6B6B",
    secondaryDark: "#7A1220",
    cubeLight: "#E53841",
    cubeDark: "#A3131A",
  } satisfies WcaPaletteInput,
  "yellow": {
    primary: "#FFD313",
    pantoneDescription: "Pantone 116 C",
    secondaryLight: "#FFF5B8",
    secondaryMedium: "#FFF5AA",
    secondaryDark: "#664D00",
    cubeLight: "#FFDE55",
    cubeDark: "#CEA705",
  } satisfies WcaPaletteInput,
  "blue": {
    primary: "#0051BA",
    pantoneDescription: "Pantone 293 C",
    secondaryLight: "#99C7FF",
    secondaryMedium: "#42D0FF",
    secondaryDark: "#003366",
    cubeLight: "#066AC4",
    cubeDark: "#03458C",
  } satisfies WcaPaletteInput,
  "orange": {
    primary: "#FF5800",
    pantoneDescription: "Pantone Orange 021 C",
    secondaryLight: "#FFD5BD",
    secondaryMedium: "#FFD59E",
    secondaryDark: "#7A2B00",
    cubeLight: "#F96E32",
    cubeDark: "#D34405",
  } satisfies WcaPaletteInput,
} as const;

const customConfig = defineConfig({
  theme: {
    tokens: {
      colors: {
        wcaWhite: {
          ...defineColorAliases(slateColors.white),

          // Smooth Luminance Scale (Anchored to Primary 1A Cool Gray)
          50: { value: "#FAFAFA" },
          100: { value: "#F5F5F5" },
          200: { value: "#EEEEEE" }, // Anchor: 1A
          300: { value: "#E0E0E0" },
          400: { value: "#BDBDBD" },
          500: { value: "#9E9E9E" },
          600: { value: "#757575" },
          700: { value: "#616161" },
          800: { value: "#424242" },
          900: { value: "#212121" },
          950: { value: "#1a1a1a" }
        },
        green: {
          ...defineColorAliases(slateColors.green),

          // Smooth Luminance Scale (Green Primary #029347 is approx 600)
          50: { value: "#F0FDF4" },
          100: { value: "#DCFCE7" },
          200: { value: "#BBF7D0" },
          300: { value: "#86EFAC" },
          400: { value: "#4ADE80" },
          500: { value: "#22C55E" },
          600: { value: "#029347" }, // Anchor: 1A
          700: { value: "#15803D" },
          800: { value: "#166534" },
          900: { value: "#14532D" },
          950: { value: "#052e16" }
        },
        red: {
          ...defineColorAliases(slateColors.red),

          // Smooth Luminance Scale (Red Primary #C62535 is approx 600)
          50: { value: "#FEF2F2" },
          100: { value: "#FEE2E2" },
          200: { value: "#FECACA" },
          300: { value: "#FCA5A5" },
          400: { value: "#F87171" },
          500: { value: "#EF4444" },
          600: { value: "#C62535" }, // Anchor: 1A
          700: { value: "#9B1C1C" },
          800: { value: "#771D1D" },
          900: { value: "#450A0A" },
          950: { value: "#2b0404" }
        },
        yellow: {
          ...defineColorAliases(slateColors.yellow),

          // Smooth Luminance Scale (Yellow Primary #FFD313 is approx 400/500)
          50: { value: "#FEFCE8" },
          100: { value: "#FEF9C3" },
          200: { value: "#FEF08A" },
          300: { value: "#FDE047" },
          400: { value: "#FFD313" }, // Anchor: 1A
          500: { value: "#EAB308" },
          600: { value: "#CA8A04" },
          700: { value: "#A16207" },
          800: { value: "#854D0E" },
          900: { value: "#713F12" },
          950: { value: "#422006" }
        },
        blue: {
          ...defineColorAliases(slateColors.blue),

          // Smooth Luminance Scale (Blue Primary #0051BA is approx 600)
          50: { value: "#EFF6FF" },
          100: { value: "#DBEAFE" },
          200: { value: "#BFDBFE" },
          300: { value: "#93C5FD" },
          400: { value: "#60A5FA" },
          500: { value: "#3B82F6" },
          600: { value: "#0051BA" }, // Anchor: 1A
          700: { value: "#1D4ED8" },
          800: { value: "#1E40AF" },
          900: { value: "#1E3A8A" },
          950: { value: "#172554" }
        },
        orange: {
          ...defineColorAliases(slateColors.orange),

          // Smooth Luminance Scale (Orange Primary #FF5800 is approx 500)
          50: { value: "#FFF7ED" },
          100: { value: "#FFEDD5" },
          200: { value: "#FED7AA" },
          300: { value: "#FDBA74" },
          400: { value: "#FB923C" },
          500: { value: "#FF5800" }, // Anchor: 1A
          600: { value: "#EA580C" },
          700: { value: "#C2410C" },
          800: { value: "#9A3412" },
          900: { value: "#7C2D12" },
          950: { value: "#431407" }
        },
        // Auxiliary Gray Palette (Compressed between White #FCFCFC and Black #1E1E1E)
        // Goal: gray.50 is DARKER than bg.white, gray.950 is LIGHTER than bg.black
        gray: {
          50: { value: "#FCFCFC", description: "Brand White (Background)" },
          100: { value: "#EDEDED", description: "Supplementary Bg Light" },
          200: { value: "#DCDCDC", description: "Supplementary Bg Medium" },
          300: { value: "#B8B8B8", description: "Supplementary Bg Dark" },
          400: { value: "#9E9E9E" }, // Interpolated
          500: { value: "#858585" }, // Interpolated
          600: { value: "#6B6B6B", description: "Supplementary Text Light / Bg Darker" },
          700: { value: "#535353" }, // Interpolated
          800: { value: "#3B3B3B", description: "Supplementary Text Dark / Bg Darkest" },
          900: { value: "#262626" }, // Interpolated (Close to black)
          950: { value: "#1E1E1E", description: "Brand Black (Background)" }
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
            // not in the styleguide, but necessary for dark mode
            //   stolen from the text colors above, so texts on Light
            //   become backgrounds on Dark. Shout if you have better ideas!
            darker: { value: "#6B6B6B" },
            darkest: { value: "#3B3B3B" },
            black: { value: "#1E1E1E" },
          },
          link: { value: "#0051BA" },
        },
      },
    },
    semanticTokens: {
      colors: {
        link: { value: "{colors.supplementary.link}" },
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
        },
      },
    },
    layerStyles: {
      'card.dark': {
        value: {
          background: "colorPalette.2A",
          color: "colorPalette.2B",
        },
      },
      'card.pastel': {
        value: {
          background: "colorPalette.1A",
          color: "colorPalette.contrast",
        },
      },
      'card.bright': {
        value: {
          background: "colorPalette.2C",
          color: "colorPalette.2A"
        },
      },
    },
    recipes: {
      button: {
        base: {
          transitionTimingFunction: "ease",
          borderRadius: "l3",
          colorPalette: "blue",
        },
        variants: {
          variant: {
            solid: {
              _hover: {
                bg: "colorPalette.muted",
                borderColor: "colorPalette.muted",
              },
              _expanded: {
                bg: "colorPalette.muted",
                borderColor: "colorPalette.muted",
              },
            },
            outline: {
              borderWidth: "2px",
              borderColor: "colorPalette.solid",
              color: "fg",
              _hover: {
                bg: "colorPalette.fg/30",
                color: "colorPalette.solid",
              },
            },
            ghost: {
              color: "fg",
              focusRing: "colorPalette.focusRing",
              _hover: {
                bg: "colorPalette.fg/30",
                color: "colorPalette.solid",
              },
              _expanded: {
                bg: "colorPalette.fg/30",
                color: "colorPalette.solid",
              },
            },
            plain: {
              color: "colorPalette.subtle",
            },
          },
          size: {
            sm: {
              padding: "3",
            },
            lg: {
              px: "6",
              py: "2.5",
              textStyle: "sm",
            },
          },
        },
        defaultVariants: {
          // @ts-expect-error This is a legitimate key, but the typing system doesn't see it before merge.
          variant: "solid",
          size: "lg",
        },
      },
      link: {
        base: {
          transitionProperty: "color",
          transitionTimingFunction: "ease",
          transitionDuration: "moderate",
        },
        variants: {
          variant: {
            wca: {
              textStyle: "hyperlink",
              _hover: {
                color: "{colors.supplementary.link/80}",
              },
            },
            header: {
              textStyle: "headerLink",
              _hover: {
                color: "{colors.supplementary.link}",
              },
            },
          },
          hoverArrow: {
            true: {
              position: "relative",
              paddingRight: "10px",
              _after: {
                content: '""',
                position: "absolute",
                top: "60%",
                right: "0",
                width: "7px",
                height: "12px",
                backgroundImage: "url('/linkArrow.svg')",
                backgroundRepeat: "no-repeat",
                backgroundSize: "contain",
                transform: "translateY(-50%) translateX(-8px)",
                transition: "all 0.3s ease-in-out",
                opacity: 0,
              },
              _hover: {
                color: "{colors.supplementary.link/80}",
                _after: {
                  transform: "translateY(-50%) translateX(0px)",
                  opacity: 1,
                },
              },
            },
          },
        },
        defaultVariants: {
          // @ts-expect-error This is a legitimate key, but the typing system doesn't see it before merge.
          variant: "wca",
          hoverArrow: false,
        },
      },
      badge: {
        variants: {
          variant: {
            information: {
              background: "transparent",
              fontWeight: "light",
              gap: 2,
            },
          },
        },
      },
      heading: {
        base: {
          fontFamily: "inherit",
        },
      },
    },
    slotRecipes: {
      stat: {
        slots: [],
        variants: {
          variant: {
            competition: {
              label: {
                color: "colorPalette.text",
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
          coloredBg: {
            true: {
              root: {
                colorPalette: "white",
                bg: "colorPalette.solid",
                color: "colorPalette.text",
              },
              description: {
                color: "colorPalette.text",
              },
            },
          },
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
            subtle: {
              item: {
                borderColor: "{colors.supplementary.bg.dark}",
                borderWidth: "1px",
                marginBottom: "3",
                _open: {
                  bg: "bg",
                },
              },
              itemTrigger: {
                padding: "3",
                bgImage: "var(--chakra-colors-color-palette-gradient-hover)",
                backgroundSize: "0% 100%", // Ensures the gradient fills the element
                backgroundRepeat: "no-repeat",
                backgroundPosition: "-100% 0%",
                animation: "slideOutGradient 0.25s ease-in-out forwards",
                _hover: {
                  animation: "slideInGradient 0.25s ease-in-out forwards",
                },
                _open: {
                  bgImage:
                    "var(--chakra-colors-color-palette-gradient-default)",
                  borderTopRadius: "var(--accordion-radius)",
                  borderBottomRadius: "0",
                  backgroundSize: "100% 100%",
                  animation: "dontSlideGradient 0.25s ease-in-out forwards",
                  _hover: {
                    bgImage:
                      "var(--chakra-colors-color-palette-gradient-hover)",
                    animation: "dontSlideGradient 0.25s ease-in-out forwards",
                  },
                },
              },
              itemContent: {
                padding: "3",
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
                "& td": {
                  transitionProperty: "background-color",
                  transitionTimingFunction: "ease",
                  transitionDuration: "150ms",
                },
                cursor: "pointer",
                "&:nth-of-type(odd) td": {
                  bg: "bg.muted",
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
          variant: {
            enclosed: {
              list: {
                bg: "colorPalette.solid",
                borderRadius: "wca",
              },
              trigger: {
                color: "colorPalette.text",
                transitionProperty: "background-color",
                transitionTimingFunction: "ease",
                transitionDuration: "200ms",
                _hover: {
                  bg: "colorPalette.solid",
                },
                _selected: {
                  color: "currentColor",
                  shadow: "sm",
                  bg: "colorPalette.solid",
                },
              },
            },
            slider: {
              root: {
                width: "100%",
              },
              content: {
                _vertical: {
                  ps: "0px",
                },
                width: "100%",
              },
              trigger: {
                p: "0px",
                width: "1rem",
                height: "1rem",
                bg: "white/50",
                cursor: "pointer",
                minWidth: "1rem",
                borderRadius: "0.5rem",
                _selected: {
                  bg: "white",
                },
              },
            },
            results: {
              content: {
                p: "8",
              },
              trigger: {
                borderRadius: "0",
                color: "fg",
                _notFirst: {
                  _before: {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    height: "1.5em",
                    width: "1.5px",
                    backgroundColor: "#D9D9D9",
                  },
                },
                _selected: {
                  bg: "colorPalette.solid",
                  color: "colorPalette.contrast",
                  _before: {
                    display: "none", // Remove the line when selected
                  },
                },
                "&[data-selected] + &::before": {
                  display: "none",
                },
              },
            },
          },
        },
      },
    },
  },
});

const removeUnwantedPalettes = (sourceColors: Record<string, any> = {}) => {
  const {
    cyan,
    purple,
    pink,
    teal,
    // Add others here if you want to fully replace defaults (e.g., green, red)
    // green,
    // red,
    ...keptColors
  } = sourceColors;

  return keptColors;
};

// 2. Sanitize the Raw Tokens (The 50-950 scales)
const sanitizedTokens = {
  ...defaultConfig.theme?.tokens,
  colors: removeUnwantedPalettes(defaultConfig.theme?.tokens?.colors),
};

// 3. Sanitize the Semantic Tokens (The functional mappings)
//    Chakra defaults often have entries like `cyan: { solid: ... }` here.
const sanitizedSemanticTokens = {
  ...defaultConfig.theme?.semanticTokens,
  colors: removeUnwantedPalettes(defaultConfig.theme?.semanticTokens?.colors),
};

// 4. Create the clean base configuration
const sanitizedDefaultConfig = defineConfig({
  ...defaultConfig,
  theme: {
    ...defaultConfig.theme,
    tokens: sanitizedTokens,
    semanticTokens: sanitizedSemanticTokens,
  },
});

export const system = createSystem(sanitizedDefaultConfig, customConfig);
