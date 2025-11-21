import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";
import { blendHex } from "@/lib/math/colors";

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

interface WcaPaletteInput {
  primary: string;         // 1A (Solid / Top Face)
  pantoneDescription: string;
  secondaryLight: string;  // 2B (Pastel)
  secondaryMedium: string; // 2C (Bright)
  secondaryDark: string;   // 2A (Deep)
  cubeLight: string;       // Left Face
  cubeDark: string;        // Right Face
}

const compileColorScale = (wcaPalette: WcaPaletteInput) => {
  return {
    'DEFAULT': { value: wcaPalette.primary },
    50: { value: blendHex('#FFFFFF', wcaPalette.secondaryLight, 0.3) },
    100: { value: wcaPalette.secondaryLight, description: "Secondary Palette 2B" },
    200: { value: blendHex(wcaPalette.secondaryLight, wcaPalette.secondaryMedium, 0.5) },
    300: { value: wcaPalette.secondaryMedium, description: "Secondary Palette 2C" },
    400: { value: blendHex(wcaPalette.secondaryMedium, wcaPalette.cubeLight, 0.5) },
    500: { value: wcaPalette.cubeLight, description: "Cube Shades left (light)" },
    600: { value: wcaPalette.primary, description: "Primary Palette 1A" },
    700: { value: wcaPalette.cubeDark, description: "Cube Shades right (dark)" },
    800: { value: blendHex(wcaPalette.cubeDark, wcaPalette.secondaryDark, 0.5) },
    900: { value: wcaPalette.secondaryDark, description: "Secondary Palette 2A" },
    950: { value: blendHex(wcaPalette.secondaryDark, '#000000', 0.4) },
    '1A': { value: wcaPalette.primary },
    '2A': { value: wcaPalette.secondaryDark },
    '2B': { value: wcaPalette.secondaryLight },
    '2C': { value: wcaPalette.secondaryMedium },
    lighter: { value: wcaPalette.cubeLight },
    darker: { value: wcaPalette.cubeDark },
  };
}

const customConfig = defineConfig({
  theme: {
    tokens: {
      colors: {
        "green": compileColorScale({
          primary: "#029347",
          pantoneDescription: "Pantone 348 C",
          secondaryLight: "#C1E6CD",
          secondaryMedium: "#00FF7F",
          secondaryDark: "#1B4D3E",
          cubeLight: "#1AB55C",
          cubeDark: "#04632D",
        }),
        "wcaWhite": compileColorScale({
          primary: "#EEEEEE",
          pantoneDescription: "Pantone Cool Gray 1 C",
          secondaryLight: "#E0DDD5",
          secondaryMedium: "#F4F1ED",
          secondaryDark: "#3B3B3B",
          cubeLight: "#FFFFFF",
          cubeDark: "#CCCCCC",
        }),
        "red": compileColorScale({
          primary: "#C62535",
          pantoneDescription: "Pantone 1797 C",
          secondaryLight: "#F6C5C5",
          secondaryMedium: "#FF6B6B",
          secondaryDark: "#7A1220",
          cubeLight: "#E53841",
          cubeDark: "#A3131A",
        }),
        "yellow": compileColorScale({
          primary: "#FFD313",
          pantoneDescription: "Pantone 116 C",
          secondaryLight: "#FFF5B8",
          secondaryMedium: "#FFF5AA",
          secondaryDark: "#664D00",
          cubeLight: "#FFDE55",
          cubeDark: "#CEA705",
        }),
        "blue": compileColorScale({
          primary: "#0051BA",
          pantoneDescription: "Pantone 293 C",
          secondaryLight: "#99C7FF",
          secondaryMedium: "#42D0FF",
          secondaryDark: "#003366",
          cubeLight: "#066AC4",
          cubeDark: "#03458C",
        }),
        "orange": compileColorScale({
          primary: "#FF5800",
          pantoneDescription: "Pantone Orange 021 C",
          secondaryLight: "#FFD5BD",
          secondaryMedium: "#FFD59E",
          secondaryDark: "#7A2B00",
          cubeLight: "#F96E32",
          cubeDark: "#D34405",
        }),
        "gray": {
          50: { "value": "#FCFCFC", description: "Supplementary BG 1 / Text White" },
          100: { "value": "#EDEDED", description: "Supplementary BG 2" },
          200: { "value": "#DCDCDC", description: "Supplementary BG 3" },
          300: { "value": "#B8B8B8", description: "Supplementary BG 4" },
          400: { "value": "#969696" },
          500: { "value": "#7D7D7D" },
          600: { "value": "#6B6B6B", description: "Supplementary Text 1" },
          700: { "value": "#535353" },
          800: { "value": "#3B3B3B", description: "Supplementary Text 2" },
          900: { "value": "#1E1E1E", description: "Supplementary Text Black" },
          950: { "value": "#111111" },
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
        advancing: { value: "{colors.green.500}" },
        advancingQuestionable: { value: "{colors.yellow.500}" },
        recordMarkers: {
          personal: { value: "{colors.orange.1A}" },
          national: { value: "{colors.green.1A}" },
          continental: { value: "{colors.red.1A}" },
          world: { value: "{colors.blue.1A}" },
        },
        bg: {
          DEFAULT: {
            value: {
              _light: "{colors.supplementary.bg.white}",
              _dark: "{colors.supplementary.bg.black}",
            },
          },
          subtle: {
            value: {
              _light: "{colors.supplementary.bg.light}",
              _dark: "{colors.supplementary.bg.darkest}",
            },
          },
          muted: {
            value: {
              _light: "{colors.supplementary.bg.medium}",
              _dark: "{colors.supplementary.bg.darker}",
            },
          },
          emphasized: {
            value: {
              _light: "{colors.supplementary.bg.dark}",
              _dark: "{colors.supplementary.bg.dark}",
            },
          },
          inverted: {
            value: {
              _light: "{colors.supplementary.bg.black}",
              _dark: "{colors.supplementary.bg.white}",
            },
          },
          panel: {
            value: {
              _light: "{colors.supplementary.bg.white}",
              _dark: "{colors.supplementary.bg.black}",
            },
          },
          error: {
            value: {
              _light: "{colors.red.2B}",
              _dark: "{colors.red.2A}",
            },
          },
          warning: {
            value: {
              _light: "{colors.orange.2B}",
              _dark: "{colors.orange.2A}",
            },
          },
          success: {
            value: {
              _light: "{colors.green.2B}",
              _dark: "{colors.green.2A}",
            },
          },
          info: {
            value: {
              _light: "{colors.blue.2B}",
              _dark: "{colors.blue.2A}",
            },
          },
        },
        border: {
          DEFAULT: {
            value: {
              _light: "{colors.supplementary.bg.medium}",
              _dark: "{colors.supplementary.bg.darker}",
            },
          },
          muted: {
            value: {
              _light: "{colors.supplementary.bg.light}",
              _dark: "{colors.supplementary.bg.darkest}",
            },
          },
          subtle: {
            value: {
              _light: "{colors.supplementary.bg.white}",
              _dark: "{colors.supplementary.bg.black}",
            },
          },
          emphasized: {
            value: {
              _light: "{colors.supplementary.bg.dark}",
              _dark: "{colors.supplementary.bg.dark}",
            },
          },
          inverted: {
            value: {
              _light: "{colors.supplementary.bg.darker}",
              _dark: "{colors.supplementary.bg.medium}",
            },
          },
          error: {
            value: {
              _light: "{colors.red.darker}",
              _dark: "{colors.red.lighter}",
            },
          },
          warning: {
            value: {
              _light: "{colors.orange.darker}",
              _dark: "{colors.orange.lighter}",
            },
          },
          success: {
            value: {
              _light: "{colors.green.darker}",
              _dark: "{colors.green.lighter}",
            },
          },
          info: {
            value: {
              _light: "{colors.blue.darker}",
              _dark: "{colors.blue.lighter}",
            },
          },
        },
        fg: {
          DEFAULT: {
            value: {
              _light: "{colors.supplementary.text.black}",
              _dark: "{colors.supplementary.text.white}",
            },
          },
          muted: {
            value: {
              _light: "{colors.supplementary.text.dark}",
              _dark: "{colors.supplementary.text.light}",
            },
          },
          subtle: {
            value: {
              _light: "{colors.supplementary.text.light}",
              _dark: "{colors.supplementary.text.dark}",
            },
          },
          inverted: {
            value: {
              _light: "{colors.supplementary.text.white}",
              _dark: "{colors.supplementary.text.black}",
            },
          },
          error: {
            value: {
              _light: "{colors.red.1A}",
              _dark: "{colors.red.2C}",
            },
          },
          warning: {
            value: {
              _light: "{colors.orange.1A}",
              _dark: "{colors.orange.2C}",
            },
          },
          success: {
            value: {
              _light: "{colors.green.1A}",
              _dark: "{colors.green.2C}",
            },
          },
          info: {
            value: {
              _light: "{colors.blue.1A}",
              _dark: "{colors.blue.2C}",
            },
          },
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

export const system = createSystem(defaultConfig, customConfig);
