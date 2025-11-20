import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const compileColorScheme = (
  baseColor: string,
  textContrast: "light" | "dark" = "light",
) => ({
  contrast: { value: `{colors.supplementary.text.${textContrast}}` },
  fg: { value: `{colors.${baseColor}.2B}` },
  subtle: { value: `{colors.${baseColor}.2A}` },
  muted: { value: `{colors.${baseColor}.2A/90}` },
  emphasized: { value: `{colors.${baseColor}.2C}` },
  solid: {
    value: {
      _light: `{colors.${baseColor}.1A}`,
      _dark: `{colors.${baseColor}.2A}`,
    },
  },
  focusRing: {
    value: {
      _light: `{colors.${baseColor}.1A}`,
      _dark: `{colors.${baseColor}.2A}`,
    },
  },
  highContrast: {
    value: {
      _light: `{colors.${baseColor}.1A}`,
      _dark: `{colors.${baseColor}.2C}`,
    },
  },
  cubeShades: {
    left: { value: `{colors.${baseColor}.lighter}` },
    top: { value: `{colors.${baseColor}.1A}` },
    right: { value: `{colors.${baseColor}.darker}` },
  },
  text: {
    value: {
      _light: `{colors.${baseColor}.contrast}`,
      _dark: `{colors.${baseColor}.2B}`,
    },
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

const customConfig = defineConfig({
  theme: {
    tokens: {
      colors: {
        green: {
          "1A": { value: "#029347", description: "Pantone 348 C" },
          "2A": { value: "#1B4D3E" },
          "2B": { value: "#C1E6CD" },
          "2C": { value: "#00FF7F" },
          lighter: { value: "#1AB55C" },
          darker: { value: "#04632D" },
        },
        wcaWhite: {
          DEFAULT: { value: "#FFFFFF" },
          "1A": { value: "#EEEEEE", description: "Pantone Cool Gray 1C" },
          "2A": { value: "#3B3B3B" },
          "2B": { value: "#E0DDD5" },
          "2C": { value: "#F4F1ED" },
          lighter: { value: "#FFFFFF" },
          darker: { value: "#CCCCCC" },
        },
        red: {
          "1A": { value: "#C62535", description: "Pantone 1797 C" },
          "2A": { value: "#7A1220" },
          "2B": { value: "#F6C5C5" },
          "2C": { value: "#FF6B6B" },
          lighter: { value: "#E53841" },
          darker: { value: "#A3131A" },
        },
        yellow: {
          "1A": { value: "#FFD313", description: "Pantone 116 C" },
          "2A": { value: "#664D00" },
          "2B": { value: "#FFF5B8" },
          "2C": { value: "#FFF5AA" },
          lighter: { value: "#FFDE55" },
          darker: { value: "#CEA705" },
        },
        blue: {
          "1A": { value: "#0051BA", description: "Pantone 293 C" },
          "2A": { value: "#003366" },
          "2B": { value: "#99C7FF" },
          "2C": { value: "#42D0FF" },
          lighter: { value: "#066AC4" },
          darker: { value: "#03458C" },
        },
        orange: {
          "1A": { value: "#FF5800", description: "Pantone Orange 021 C" },
          "2A": { value: "#7A2B00" },
          "2B": { value: "#FFD5BD" },
          "2C": { value: "#FFD59E" },
          lighter: { value: "#F96E32" },
          darker: { value: "#D34405" },
        },
        supplementary: {
          text: {
            light: { value: "#FCFCFC" },
            dark: { value: "#1E1E1E" },
            lightgray: { value: "#6B6B6B" },
            darkgray: { value: "#3B3B3B" },
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
              _light: "{colors.supplementary.bg.light}",
              _dark: "{colors.supplementary.bg.darkest}",
            },
          },
          emphasized: {
            value: {
              _light: "{colors.supplementary.bg.medium}",
              _dark: "{colors.supplementary.bg.darker}",
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
              _dark: "{colors.gray.950}",
            },
          },
        },
        fg: {
          DEFAULT: {
            value: {
              _light: "{colors.supplementary.text.dark}",
              _dark: "{colors.supplementary.text.light}",
            },
          },
          muted: {
            value: {
              _light: "{colors.supplementary.text.darkgray}",
              _dark: "{colors.supplementary.text.lightgray}",
            },
          },
          subtle: {
            value: {
              _light: "{colors.supplementary.text.lightgray}",
              _dark: "{colors.supplementary.text.darkgray}",
            },
          },
          inverted: {
            value: {
              _light: "{colors.supplementary.text.light}",
              _dark: "{colors.supplementary.text.dark}",
            },
          },
        },
        green: compileColorScheme("green"),
        white: {
          ...compileColorScheme("wcaWhite"),
          // white has special behavior for contrast colors between light/dark modes
          contrast: {
            value: {
              _light: "{colors.supplementary.text.dark}",
              _dark: "{colors.supplementary.text.light}",
            },
          },
          solid: {
            value: {
              _light: "{colors.wcaWhite.2C}",
              _dark: "{colors.wcaWhite.2A}",
            },
          },
        },
        red: compileColorScheme("red"),
        yellow: compileColorScheme("yellow", "dark"),
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
              focusRing: "colorPalette.highContrast",
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
                color: "{colors.blue.highContrast/80}",
              },
            },
            header: {
              textStyle: "headerLink",
              _hover: {
                color: "{colors.blue.highContrast}",
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
                color: "{colors.blue.highContrast/80}",
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
