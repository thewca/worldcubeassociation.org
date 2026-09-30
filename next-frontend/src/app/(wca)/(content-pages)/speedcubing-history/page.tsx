import { Box, Center, Heading, Image, Text, VStack } from "@chakra-ui/react";
import Quote from "@/components/Quote";
import { io } from "next/cache";
import { getCachedGlobal } from "@/lib/payload/globals";
import { Media } from "@/types/payload";
import { ChakraMarkdown } from "@/components/Markdown";
import { getT } from "@/lib/i18n/get18n";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();

  return {
    title: t("layouts.navigation.speedcubing_history"),
  };
}

export default async function SpeedcubingHistory() {
  // `io()` marks the boundary the build-time prerender stops at, so the Payload read below
  // never runs while building, where MongoDB is unreachable. It has to stay out here rather
  // than inside `getCachedGlobal`: within a `"use cache"` scope `io()` resolves immediately.
  await io();

  const historyPage = await getCachedGlobal("speedcubing-history-page");

  const historyItems = historyPage.blocks;

  if (historyItems.length === 0) {
    return <Heading>No History Items, add some!</Heading>;
  }

  const { t } = await getT();

  return (
    <VStack gap="8" width="full" alignItems="left">
      <Heading size="5xl">{t("speedcubing_history.title")}</Heading>
      {historyItems.map((item) => {
        switch (item.blockType) {
          case "quote": {
            return (
              <Quote
                key={item.id}
                content={item.contentMarkdown!}
                author={item.quotedPerson}
              />
            );
          }
          case "paragraph": {
            return (
              <ChakraMarkdown key={item.id}>
                {item.contentMarkdown!}
              </ChakraMarkdown>
            );
          }
          case "captionedImage": {
            const image = item.image as Media;
            return (
              <Center key={item.id}>
                <Box>
                  <Image src={image.url!} alt={item.caption} />
                  <Text>{item.caption}</Text>
                </Box>
              </Center>
            );
          }
        }
      })}
    </VStack>
  );
}
