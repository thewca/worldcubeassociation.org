"use client";
// Static markup, but a client component on purpose: it reads `slateRoleRungs`
//   from `@/theme`, and importing that module runs Chakra's `createSystem`,
//   which pulls in Ark UI's anatomies and cannot be evaluated in the RSC graph.

import {
  Badge,
  Box,
  Button,
  Card,
  HStack,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import { slateRoleRungs, type SlatePalette } from "@/theme";

const PALETTES = Object.keys(slateRoleRungs) as SlatePalette[];

const ROLES = [
  { token: "2B", name: "Pastel" },
  { token: "2C", name: "Bright" },
  { token: "1A", name: "Solid" },
  { token: "2A", name: "Deep" },
] as const;

const CARD_LAYERS = [
  { layerStyle: "card.pastel", name: "card.pastel", pairing: "1A + contrast" },
  { layerStyle: "card.bright", name: "card.bright", pairing: "2C + 2A" },
  { layerStyle: "card.dark", name: "card.dark", pairing: "2A + 2B" },
] as const;

const CUBE_FACES = [
  { token: "cubeShades.left", name: "Left" },
  { token: "cubeShades.top", name: "Top" },
  { token: "cubeShades.right", name: "Right" },
] as const;

const Section = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <Stack gap="4">
    <Stack gap="1">
      <Text textStyle="s3">{title}</Text>
      <Text textStyle="annotation" color="fg.muted">
        {description}
      </Text>
    </Stack>
    {children}
  </Stack>
);

// Each role is labelled with the rung it resolves to, which is the whole point:
//   `2C` is not a colour of its own, it is whichever step the family assigns.
const RoleStrip = ({ palette }: { palette: SlatePalette }) => (
  <Stack gap="2" colorPalette={palette}>
    <Text textStyle="s4">{palette}</Text>
    <HStack gap="1" alignItems="stretch">
      {ROLES.map((role) => (
        <Stack key={role.token} flex="1" gap="1">
          <Box
            bg={`colorPalette.${role.token}`}
            height="12"
            borderRadius="sm"
            borderWidth="1px"
            borderColor="border"
          />
          <Text textStyle="annotation">{role.name}</Text>
          <Text textStyle="annotation" color="fg.muted">
            {role.token} · {slateRoleRungs[palette][role.token]}
          </Text>
        </Stack>
      ))}
    </HStack>
  </Stack>
);

const LadderStrip = ({ palette }: { palette: SlatePalette }) => {
  // Widened: the `as const` rung map narrows to only the steps that happen to
  //   carry a role, which would reject the unused steps below.
  const rungs: ReadonlyArray<string> = Object.values(slateRoleRungs[palette]);

  return (
    <Stack gap="2" colorPalette={palette}>
      <Text textStyle="s4">{palette}</Text>
      <HStack gap="0.5" alignItems="stretch">
        {(
          [
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
          ] as const
        ).map((step) => (
          <Stack key={step} flex="1" gap="1">
            <Box
              bg={`colorPalette.${step}`}
              height="10"
              borderRadius="xs"
              borderWidth="1px"
              borderColor="border"
            />
            <Text
              textStyle="annotation"
              textAlign="center"
              color={rungs.includes(step) ? "fg" : "fg.muted"}
              fontWeight={rungs.includes(step) ? "bold" : "light"}
            >
              {step}
            </Text>
          </Stack>
        ))}
      </HStack>
    </Stack>
  );
};

const CardLayerRow = ({ palette }: { palette: SlatePalette }) => (
  <Stack gap="2" colorPalette={palette}>
    <Text textStyle="s4">{palette}</Text>
    <SimpleGrid columns={3} gap="2">
      {CARD_LAYERS.map((layer) => (
        <Stack
          key={layer.name}
          layerStyle={layer.layerStyle}
          borderRadius="wca"
          padding="3"
          gap="1"
        >
          <Text textStyle="bodyEmphasis">{layer.name}</Text>
          <Text textStyle="annotation">{layer.pairing}</Text>
        </Stack>
      ))}
    </SimpleGrid>
  </Stack>
);

export default function SlateRoleExamples() {
  return (
    <Card.Root width="full">
      <Card.Body gap="10">
        <Stack gap="1">
          <Card.Title>Slate roles in use</Card.Title>
          <Text textStyle="annotation" color="fg.muted">
            The brand vocabulary (1A / 2A / 2B / 2C) resolves to positions on
            each family&#39;s generated scale rather than to standalone colours.
            Solid and Deep are Slate&#39;s hexes verbatim; Pastel and Bright are
            read off the ladder.
          </Text>
        </Stack>

        <Section
          title="Every role is a rung"
          description="The rung each role lands on is per-family, because the primaries differ in lightness. Solid sits at 600 in green and red, 700 in blue, 500 in orange, 400 in yellow and 100 in white."
        >
          <SimpleGrid columns={{ base: 1, lg: 2 }} gap="6">
            {PALETTES.map((palette) => (
              <RoleStrip key={palette} palette={palette} />
            ))}
          </SimpleGrid>
        </Section>

        <Section
          title="The ladder each role is drawn from"
          description="Bold steps are the ones carrying a brand role. Every family runs light to dark without reversing, so a component written against a step number behaves the same in all six."
        >
          <Stack gap="5">
            {PALETTES.map((palette) => (
              <LadderStrip key={palette} palette={palette} />
            ))}
          </Stack>
        </Section>

        <Section
          title="Card layer styles"
          description="These three pairings are why Bright sits in the light half of the ladder: card.bright uses it as a background for Deep-toned text."
        >
          <Stack gap="5">
            {PALETTES.map((palette) => (
              <CardLayerRow key={palette} palette={palette} />
            ))}
          </Stack>
        </Section>

        <Section
          title="One component, six palettes"
          description="None of these buttons or badges name a colour. They inherit colorPalette and read the same rungs, which is what the scale contract buys."
        >
          <Stack gap="4">
            {PALETTES.map((palette) => (
              <HStack key={palette} gap="3" wrap="wrap" colorPalette={palette}>
                <Text textStyle="s4" width="24">
                  {palette}
                </Text>
                <Button variant="solid">Solid</Button>
                <Button variant="subtle">Subtle</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="pastelOutline">Pastel outline</Button>
                <Badge variant="solid">Solid</Badge>
                <Badge variant="subtle">Subtle</Badge>
                <Badge variant="outline">Outline</Badge>
              </HStack>
            ))}
          </Stack>
        </Section>

        <Section
          title="Cube faces"
          description="The three isometric face shades stay as Slate delivered them — they are decorative, never asked to carry text, and so were left outside the ladder."
        >
          <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} gap="4">
            {PALETTES.map((palette) => (
              <Stack key={palette} gap="2" colorPalette={palette}>
                <Text textStyle="s4">{palette}</Text>
                <HStack gap="1" alignItems="stretch">
                  {CUBE_FACES.map((face) => (
                    <Stack key={face.name} flex="1" gap="1">
                      <Box
                        bg={`colorPalette.${face.token}`}
                        height="10"
                        borderRadius="xs"
                        borderWidth="1px"
                        borderColor="border"
                      />
                      <Text textStyle="annotation" color="fg.muted">
                        {face.name}
                      </Text>
                    </Stack>
                  ))}
                </HStack>
              </Stack>
            ))}
          </SimpleGrid>
        </Section>
      </Card.Body>
    </Card.Root>
  );
}
