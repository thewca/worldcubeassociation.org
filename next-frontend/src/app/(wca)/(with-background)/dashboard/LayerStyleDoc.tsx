import { Box, Button, HStack, Stack, Text, Wrap } from "@chakra-ui/react";
import { TokenDoc } from "@/app/(wca)/(with-background)/dashboard/ThemeExplorer";
import type { UtilityValues } from "@/types/chakra/prop-types.gen";

type LayerStyleName = UtilityValues["layerStyle"];

/// Grouping doubles as an exhaustiveness check: `Record` makes TypeScript
///   demand an entry for every registered layer style, so adding one to the
///   theme without documenting it here fails the build.
const LAYER_STYLE_GROUPS: Record<LayerStyleName, string> = {
  "fill.subtle": "Fill",
  "fill.surface": "Fill",
  "fill.muted": "Fill",
  "fill.emphasized": "Fill",
  "fill.solid": "Fill",
  "outline.subtle": "Outline",
  "outline.solid": "Outline",
  "indicator.top": "Indicator",
  "indicator.bottom": "Indicator",
  "indicator.start": "Indicator",
  "indicator.end": "Indicator",
  disabled: "State",
  none: "State",
};

const GROUP_ORDER = ["Fill", "Outline", "Indicator", "State"];

const PALETTES = [
  "blue",
  "red",
  "green",
  "orange",
  "yellow",
  "wcaWhite",
] as const;

function LayerStyleRow({ layerStyle }: { layerStyle: LayerStyleName }) {
  return (
    <TokenDoc title={layerStyle}>
      <Wrap gap="4">
        {PALETTES.map((palette) => (
          <Box
            key={palette}
            colorPalette={palette}
            layerStyle={layerStyle}
            borderRadius="wca"
            p="4"
            minWidth="15rem"
            flex="1"
          >
            <Text textStyle="s1">{palette}</Text>
            <Text textStyle="body">Card body copy on this surface.</Text>
            <HStack gap="2" mt="3">
              <Button size="xs" variant="solid">
                Solid
              </Button>
              <Button size="xs" variant="outline">
                Outline
              </Button>
            </HStack>
          </Box>
        ))}
      </Wrap>
    </TokenDoc>
  );
}

function ButtonRow({ layerStyle }: { layerStyle: LayerStyleName }) {
  return (
    <TokenDoc title={layerStyle}>
      <Wrap gap="3">
        {PALETTES.map((palette) => (
          <Button
            key={palette}
            colorPalette={palette}
            layerStyle={layerStyle}
            variant="plain"
            size="sm"
          >
            {palette}
          </Button>
        ))}
      </Wrap>
    </TokenDoc>
  );
}

const NAMES = Object.keys(LAYER_STYLE_GROUPS) as LayerStyleName[];

const byGroup = (group: string) =>
  NAMES.filter((name) => LAYER_STYLE_GROUPS[name] === group);

/// Every layer style the theme registers, applied first to a card surface and
///   then directly to a button, so both readings of a style are visible side by
///   side in whichever colour mode the page is being viewed in.
export default function LayerStyleDoc() {
  return (
    <Stack gap="10" my="8">
      {GROUP_ORDER.map((group) => (
        <Stack key={group} gap="4">
          <Text textStyle="h3">{group}</Text>
          {byGroup(group).map((name) => (
            <LayerStyleRow key={name} layerStyle={name} />
          ))}
        </Stack>
      ))}

      <Stack gap="4">
        <Text textStyle="h3">Applied directly to buttons</Text>
        {NAMES.map((name) => (
          <ButtonRow key={name} layerStyle={name} />
        ))}
      </Stack>
    </Stack>
  );
}
