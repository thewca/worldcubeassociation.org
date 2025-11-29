"use client";
// Utterly stolen from https://github.com/chakra-ui/chakra-ui/blob/main/apps/compositions/src/lib/color-token-doc.tsx

import {
  Box,
  BoxProps,
  Center,
  SimpleGrid,
  type SimpleGridProps,
  Stack,
  Text,
  type TokenInterface,
  VStack,
} from "@chakra-ui/react";
import { system } from "@/theme";

interface TokenDocProps extends BoxProps {
  action?: React.ReactNode;
}

export const TokenDoc = (props: TokenDocProps) => {
  const { title, children, action, ...rest } = props;
  return (
    <Box bg="bg" rounded="lg" borderWidth="0.5px" {...rest}>
      <Box p="6" pb="0">
        {title && (
          <Box fontWeight="medium" fontSize="sm" as="h2">
            {title}
          </Box>
        )}
        {action}
      </Box>
      <Box p="6">{children}</Box>
    </Box>
  );
};

const { tokens } = system;

const colors = tokens.categoryMap.get("colors")!;
const allColors = Array.from(colors.values());

const keys = ["gray", "red", "blue", "green", "yellow", "orange", "white"];

export const ColorTokenDoc = () => {
  return (
    <Stack gap="8" my="8">
      {keys.map((key) => (
        <TokenDoc key={key} title={key}>
          <ColorGrid
            tokens={allColors.filter(
              (token) =>
                token.name.startsWith(`colors.${key}`) &&
                !token.extensions.conditions,
            )}
          />
        </TokenDoc>
      ))}
    </Stack>
  );
};

export const ColorSemanticTokenDoc = () => {
  return (
    <Stack gap="8" my="8">
      <TokenDoc title="background">
        <ColorGrid
          tokens={allColors.filter((token) =>
            token.name.startsWith("colors.bg"),
          )}
        />
      </TokenDoc>

      <TokenDoc title="border">
        <ColorGrid
          variant="border"
          tokens={allColors.filter((token) =>
            token.name.startsWith("colors.border"),
          )}
        />
      </TokenDoc>

      <TokenDoc title="text">
        <ColorGrid
          variant="text"
          tokens={allColors.filter((token) =>
            token.name.startsWith("colors.fg"),
          )}
        />
      </TokenDoc>

      {keys.map((key) => (
        <TokenDoc key={key} title={key}>
          <ColorGrid
            tokens={allColors.filter(
              (token) =>
                token.name.startsWith(`colors.${key}`) &&
                token.extensions.conditions,
            )}
          />
        </TokenDoc>
      ))}
    </Stack>
  );
};

interface VariantProps {
  variant?: "border" | "background" | "text";
}

interface ColorGridItemProps extends VariantProps {
  token: TokenInterface;
}

const ColorGridItem = (props: ColorGridItemProps) => {
  const { token, variant = "background" } = props;
  const value = token.extensions.cssVar!.ref;
  const conditions = token.extensions.conditions;
  return (
    <VStack flex="1">
      <Center
        borderWidth="1px"
        bg={(() => {
          if (variant === "text" && token.name.includes("inverted"))
            return "bg.inverted";
          return variant === "background" ? value : undefined;
        })()}
        w="full"
        h="20"
        rounded="lg"
        color={variant === "text" ? value : undefined}
        borderColor={variant === "border" ? value : undefined}
      >
        {variant === "text" && <Text fontSize="lg">Ag</Text>}
      </Center>
      <Text textStyle="xs">{token.name.replace("colors.", "")}</Text>
      {conditions && (
        <Stack mt="1">
          {Object.entries(conditions).map(([key, value]) => (
            <Text key={key} fontSize="xs" mt="-1" color="fg.muted">
              {key.replace("_", "")}: {value.replace("colors.", "")}
            </Text>
          ))}
        </Stack>
      )}
      {!conditions && (
        <Text fontSize="xs" mt="-1" color="fg.muted">
          {token.originalValue}
        </Text>
      )}
    </VStack>
  );
};

interface ColorGridProps extends VariantProps, SimpleGridProps {
  tokens: TokenInterface[];
}

export const ColorGrid = (props: ColorGridProps) => {
  const { tokens, variant = "background", ...rest } = props;
  return (
    <SimpleGrid minChildWidth="120px" gap="4" {...rest}>
      {tokens.map((token) => (
        <ColorGridItem key={token.name} token={token} variant={variant} />
      ))}
    </SimpleGrid>
  );
};
