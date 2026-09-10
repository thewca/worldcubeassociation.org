import { io } from "next/cache";
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
  // `io()` marks the boundary the build-time prerender stops at, so the Payload read below
  // never runs while building, where MongoDB is unreachable. It has to stay out here rather
  // than inside `getCachedGlobal`: within a `"use cache"` scope `io()` resolves immediately.
  await io();

  const privacyPage = await getCachedGlobal("privacy-page");

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
