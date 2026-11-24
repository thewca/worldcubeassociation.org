import { getCachedGlobal } from "@/lib/payload/globals";
import { Box, Heading, VStack } from "@chakra-ui/react";
import { ChakraMarkdown } from "@/components/Markdown";
import { Metadata } from "next";
import { getT } from "@/lib/i18n/get18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();

  return {
    title: t("layouts.navigation.privacy"),
  };
}

export default async function Privacy() {
  const { t, lng } = await getT();

  const privacyPage = await getCachedGlobal("privacy-page", lng);

  const privacyItems = privacyPage.blocks;

  if (privacyItems.length === 0) {
    return (
      <Heading>
        {/* eslint-disable-line no-restricted-syntax -- Backoffice-only text */}
        No Privacy Items, add some!
      </Heading>
    );
  }

  return (
    <VStack gap="8" width="full" alignItems="left">
      <Heading size="5xl">{t("privacy.title")}</Heading>
      <ChakraMarkdown>{privacyPage.preambleMarkdown}</ChakraMarkdown>
      {privacyItems.map((item) => (
        <Box key={item.id}>
          <Heading size="xl">{item.title}</Heading>
          <ChakraMarkdown>{item.contentMarkdown}</ChakraMarkdown>
        </Box>
      ))}
    </VStack>
  );
}
