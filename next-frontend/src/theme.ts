import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const compileColorScheme = (
  baseColor: string,
  textContrast: "light" | "dark" = "light",
) => ({
  contrast: { value: `{colors.supplementary.texts.${textContrast}}` },
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
        white: {
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
          ...compileColorScheme("white"),
          // white has special behavior for contrast colors between light/dark modes
          contrast: {
            value: {
              _light: "{colors.supplementary.text.dark}",
              _dark: "{colors.supplementary.text.light}",
            },
          },
          solid: {
            value: {
              _light: "colors.wcawhite.2C",
              _dark: "colors.wcawhite.2A",
            },
          },
        },
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
    },
    recipes: {
      button: {
        base: {
          transitionProperty: "background, border, color, borderColor",
          transitionTimingFunction: "ease",
          borderRadius: "l3",
          lineHeight: "1.2",
          colorPalette: "blue",
        },
        variants: {
          variant: {
            solid: {
              borderWidth: "2px",
              borderColor: "colorPalette.solid",
              _hover: {
                bg: "colorPalette.muted",
                borderColor: "colorPalette.muted",
                // TODO GB color: "whiteText",
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
              bg: "transparent",
              _hover: {
                bg: "colorPalette.fg/30",
              },
            },
            ghost: {
              borderWidth: "0px",
              bg: "transparent",
              color: "fg",
              focusRing: "colorPalette.highContrast",
              _hover: {
                color: "colorPalette.highContrast",
                bg: "transparent",
              },
              _expanded: {
                bg: "transparent",
              },
            },
            surface: {
              // TODO GB color: "whiteText",
            },
            plain: {
              color: "colorPalette.subtle",
              // TODO GB bg: "lightBackground",
              _hover: {
                // TODO GB bg: "mediumBackground",
              },
            },
          },
          size: {
            sm: {
              padding: "3",
              textStyle: "sm",
            },
            lg: {
              px: "6",
              py: "2.5",
              textStyle: "sm",
            },
          },
        },
        defaultVariants: {
          variant: "solid",
          size: "lg",
        },
      },
      heading: {
        base: {},
        variants: {
          size: {
            sm: {
              fontWeight: "medium", // Not used in styleguide
            },
            md: {
              fontWeight: "medium", // Subheading 2
              textStyle: "lg", // same size as lg, just thinner
            },
            lg: {
              fontWeight: "bold", // Subheading 1
            },
            xl: {
              fontWeight: "bold", // Not used in styleguide
            },
            "2xl": {
              fontWeight: "extrabold", // H4
            },
            "3xl": {
              fontWeight: "extrabold", // H3
            },
            "4xl": {
              fontWeight: "extrabold", // H2
            },
            "5xl": {
              fontWeight: "extrabold", // H1
              textTransform: "uppercase",
            },
            "6xl": {
              fontWeight: "extrabold", // Not used in styleguide
            },
          },
        },
      },
      link: {
        base: {
          transitionProperty: "color",
          transitionTimingFunction: "ease",
          transitionDuration: "200ms",
        },
        variants: {
          variant: {
            wcaLink: {
              color: "{colors.blue.highContrast}",
              fontWeight: "medium",
              _hover: {
                color: "{colors.blue.highContrast/80}",
              },
            },
            plainLink: {
              color: "{fg.inverse}",
              fontWeight: "medium",
              _hover: {
                color: "{colors.blue.highContrast}",
              },
            },
            colouredLink: {
              color: "{fg.inverse}",
              fontWeight: "medium",
              _hover: {
                color: "colorPalette.highContrast",
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
          variant: "wcaLink",
          hoverArrow: "false",
        },
      },
      badge: {
        variants: {
          variant: {
            achievement: {
              bg: "transparent",
              color: "fg",
              fontWeight: "medium",
              gap: "2",
              mr: "2.5",
            },
            information: {
              bg: "transparent",
              color: "colorPalette.contrast",
              fontWeight: "light",
              gap: "2",
              mr: "2.5",
            },
          },
        },
        compoundVariants: [
          {
            variant: "achievement",
            css: {
              textStyle: "lg", // needed to supercede the default textStyle
              svg: {
                height: "1.25em",
                width: "1.25em",
              },
            },
          },
          {
            variant: "information",
            css: {
              textStyle: "md", // needed to supercede the default textStyle
              svg: {
                height: "1.1em",
                width: "1.1em",
              },
              img: {
                height: "1.1em",
                width: "auto",
                borderRadius: "3px",
              },
            },
          },
        ],
      },
      prose: {
        base: {
          "& a": {
            color: "{colors.blue.highContrast}",
            fontWeight: "medium",
            _hover: {
              color: "{colors.blue.highContrast/80}",
            },
          },
        },
      },
    },
    slotRecipes: {
      card: {
        base: {
          root: {
            shadow: "{shadows.wca}",
            colorPalette: "grey",
            borderRadius: "xl",
          },
        },
        defaultVariants: {
          size: "sm",
        },
        variants: {
          variant: {
            hero: {
              body: {
                bg: "colorPalette.solid",
                color: "colorPalette.contrast",
              },
            },
            summary: {
              body: {
                bg: "colorPalette.solid",
                color: "colorPalette.contrast",
                p: "7",
                gap: "3",
              },
            },
            info: {
              root: {
                overflow: "hidden",
              },
              body: {
                bg: "colorPalette.solid",
                color: "colorPalette.contrast",
                gap: "4",
              },
              title: {
                fontWeight: "extrabold",
              },
              description: {
                color: "colorPalette.contrast",
              },
            },
            plain: {
              root: {
                overflow: "hidden",
                bg: "bg",
                p: "2",
                w: "100%",
                flexGrow: "1",
              },
              body: {
                gap: "4",
              },
            },
            infoSnippet: {
              root: {
                shadow: "none",
              },
              body: {
                p: "0px",
              },
              header: {
                p: "0px",
                fontWeight: "semibold",
                flexDirection: "row",
                alignItems: "center",
                gap: "1",
              },
            },
          },
        },
        compoundVariants: [
          {
            variant: "info",
            css: {
              title: { textStyle: "4xl" }, // needed to supercede the default textStyle
            },
          },
          {
            variant: "infoSnippet",
            css: {
              header: {
                svg: {
                  height: "1.15em",
                  width: "1.15em",
                },
              },
            },
          },
        ],
      },
      checkboxCard: {
        slots: [],
        variants: {
          size: {
            xs: {
              root: {
                textStyle: "xs",
              },
              control: {
                padding: "1",
                gap: "0.5",
              },
              addon: {
                px: "1.5",
                py: "0.5",
                borderTopWidth: "1px",
              },
              indicator: {
                boxSize: "2",
              },
            },
          },
        },
      },
      segmentGroup: {
        slots: [],
        variants: {
          variant: {
            inset: {
              root: {
                bg: "transparent",
              },
              item: {
                px: "5",
                py: "2.5",
                fontWeight: "600",
                border: "2px solid",
                borderColor: "colorPalette.solid",
                color: "colorPalette.highContrast",
                bg: "transparent",
                borderRadius: "0",
                transition: "all 250ms",
                cursor: "pointer",
                _first: {
                  borderTopLeftRadius: "5px",
                  borderBottomLeftRadius: "5px",
                  borderRight: "0px",
                },
                _last: {
                  borderTopRightRadius: "5px",
                  borderBottomRightRadius: "5px",
                  borderLeft: "0px",
                },
                _checked: {
                  bg: "colorPalette.solid",
                  color: "colorPalette.contrast",
                  boxShadow: "inset rgba(0, 0, 0, 0.25) 0 0 5px 0",
                },
                "&:not([data-state=checked]):hover": {
                  bg: "colorPalette.fg/30",
                },
              },
              indicator: {
                display: "none",
              },
            },
          },
        },
      },
      accordion: {
        slots: [],
        variants: {
          variant: {
            subtle: {
              root: {
                "--accordion-radius": "radii.l3",
              },
              item: {
                borderColor: "{colors.supplementary.bgs.mid}",
                borderWidth: "1px",
                marginBottom: "3",
                _open: {
                  bg: "bg",
                },
              },
              itemTrigger: {
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
            },
          },
        },
      },
      table: {
        slots: [],
        variants: {
          variant: {
            results: {
              cell: {
                p: "0",
              },
            },
            competitions: {
              root: {
                tableLayout: "auto",
              },
              cell: {
                width: "1%",
                whiteSpace: "noWrap",
                padding: "0",
                "& img": {
                  height: "1.1em",
                  width: "2.8em",
                  borderRadius: "3px",
                },
              },
              row: {
                "& td": {
                  transitionProperty: "background-color",
                  transitionTimingFunction: "ease",
                  transitionDuration: "150ms",
                },
                cursor: "pointer",
                width: "100%",
                "&:nth-of-type(odd) td": {
                  bg: "bg.muted",
                },
                "&:hover td": {
                  bg: "blue.400/60",
                },
              },
            },
          },
          size: {
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
      drawer: {
        slots: [],
        variants: {
          variant: {
            competitionInfo: {
              content: {
                borderRadius: "xl",
                shadow: "{shadows.wca}",
                height: "max-content",
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
                bg: "bg",
                shadow: "{shadows.wca}",
                p: "3",
                borderRadius: "xl",
                gap: "3",
              },
              trigger: {
                transitionProperty: "background-color",
                transitionTimingFunction: "ease",
                transitionDuration: "200ms",
                _hover: {
                  bg: "bg.muted/50",
                },
                _selected: {
                  bg: "bg.muted",
                },
                _vertical: {
                  justifyContent: "flex-start",
                },
              },
              content: {
                flexGrow: "1",
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
      dataList: {
        slots: [],
        variants: {
          variant: {
            profileStat: {
              root: {
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                columnGap: "2rem",
                rowGap: "0.5rem",
              },
              item: {
                flexDirection: "column-reverse",
                alignItems: "flex-start", // default for left column
                _even: {
                  alignItems: "flex-end", // right column overrides
                },
              },
              itemLabel: {
                fontWeight: "regular",
              },
              itemValue: {
                fontWeight: "semibold",
              },
            },
          },
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, customConfig);
