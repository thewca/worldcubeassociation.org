import { getCachedGlobal } from "@/lib/payload/globals";
import { Box, Heading, VStack } from "@chakra-ui/react";
import { ChakraMarkdown } from "@/components/Markdown";
import { Metadata } from "next";
import { getT } from "@/lib/i18n/get18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();

  return {
    title: t("layouts.navigation.disclaimer"),
  };
}
export default async function Disclaimer() {
  const { lng } = await getT();

  const disclaimerPage = await getCachedGlobal("disclaimer-page", lng);

  const disclaimerItems = disclaimerPage.blocks;

  if (disclaimerItems.length === 0) {
    return (
      <Heading>
        {/* eslint-disable-line no-restricted-syntax -- Existing text added before we started enforcing translations */}
        No Disclaimer Items, add some!
      </Heading>
    );
  }

  return (
    <VStack gap="8" width="full" alignItems="left">
      <Heading size="5xl">
        {/* eslint-disable-line no-restricted-syntax -- Existing text added before we started enforcing translations */}
        Disclaimer
      </Heading>
      {disclaimerItems.map((item) => (
        <Box key={item.id}>
          {item.title && <Heading size="xl">{item.title}</Heading>}
          <ChakraMarkdown>{item.contentMarkdown}</ChakraMarkdown>
        </Box>
      ))}
    </VStack>
  );
}
