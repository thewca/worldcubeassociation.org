"use server";

import {
  Container,
  Heading,
  VStack,
  Text,
  Box,
  Image,
  Center,
} from "@chakra-ui/react";
import Quote from "@/components/Quote";
import { getPayload } from "payload";
import config from "@payload-config";
import { Media } from "@/types/payload";
import { MarkdownProse } from "@/components/Markdown";
import { getT } from "@/lib/i18n/get18n";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();

  return {
    title: t("layouts.navigation.speedcubing_history"),
  };
}

export default async function SpeedcubingHistory() {
  const payload = await getPayload({ config });

  const historyPage = await payload.findGlobal({
    slug: "speedcubing-history-page",
  });

  const historyItems = historyPage.blocks;

  if (historyItems.length === 0) {
    return <Heading>No History Items, add some!</Heading>;
  }

  const { t } = await getT();

  return (
    <Container bg="bg">
      <VStack gap="8" width="full" pt="8" alignItems="left">
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
                <MarkdownProse
                  key={item.id}
                  content={item.contentMarkdown!}
                  as={Text}
                />
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
    </Container>
  );
}
