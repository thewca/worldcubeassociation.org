import { io } from "next/cache";
import { getCachedGlobal } from "@/lib/payload/globals";
import { Box, Heading, VStack } from "@chakra-ui/react";
import { ChakraMarkdown } from "@/components/Markdown";
import { Metadata } from "next";
import { getStaticT } from "@/lib/i18n/getStaticT";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getStaticT();

  return {
    title: t("layouts.navigation.disclaimer"),
  };
}
export default async function Disclaimer() {
  // `io()` marks the boundary the build-time prerender stops at, so the Payload read below
  // never runs while building, where MongoDB is unreachable. It has to stay out here rather
  // than inside `getCachedGlobal`: within a `"use cache"` scope `io()` resolves immediately.
  await io();

  const disclaimerPage = await getCachedGlobal("disclaimer-page");

  const disclaimerItems = disclaimerPage.blocks;

  if (disclaimerItems.length === 0) {
    return <Heading>No Disclaimer Items, add some!</Heading>;
  }

  return (
    <VStack gap="8" width="full" alignItems="left">
      <Heading size="5xl">Disclaimer</Heading>
      {disclaimerItems.map((item) => (
        <Box key={item.id}>
          {item.title && <Heading size="xl">{item.title}</Heading>}
          <ChakraMarkdown>{item.contentMarkdown}</ChakraMarkdown>
        </Box>
      ))}
    </VStack>
  );
}
