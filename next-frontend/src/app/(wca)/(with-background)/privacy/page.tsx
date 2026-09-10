import { getPayload } from "payload";
import config from "@payload-config";
import { connection } from "next/server";
import { Box, Heading, VStack } from "@chakra-ui/react";
import { ChakraMarkdown } from "@/components/Markdown";
import { Metadata } from "next";
import { getStaticT } from "@/lib/i18n/getStaticT";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getStaticT();

  return {
    title: t("layouts.navigation.privacy"),
  };
}

export default async function Privacy() {
  await connection();

  const payload = await getPayload({ config });

  const privacyPage = await payload.findGlobal({
    slug: "privacy-page",
  });

  const privacyItems = privacyPage.blocks;

  if (privacyItems.length === 0) {
    return <Heading>No Privacy Items, add some!</Heading>;
  }

  return (
    <VStack gap="8" width="full" alignItems="left">
      <Heading size="5xl">WCA Privacy Statement</Heading>
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
