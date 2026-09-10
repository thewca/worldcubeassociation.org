import { Card, Heading, VStack } from "@chakra-ui/react";
import { io } from "next/cache";
import { getCachedGlobal } from "@/lib/payload/globals";
import { ChakraMarkdown } from "@/components/Markdown";
import { getT } from "@/lib/i18n/get18n";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();

  return {
    title: t("about_regulations.title"),
  };
}

export default async function AboutTheRegulations() {
  // `io()` marks the boundary the build-time prerender stops at, so the Payload read below
  // never runs while building, where MongoDB is unreachable. It has to stay out here rather
  // than inside `getCachedGlobal`: within a `"use cache"` scope `io()` resolves immediately.
  await io();

  const aboutRegulations = await getCachedGlobal("about-regulations-page");

  const aboutRegulationsItems = aboutRegulations.blocks;

  if (aboutRegulationsItems.length === 0) {
    return <Heading>No About Regulations Items, add some!</Heading>;
  }

  const { t } = await getT();

  return (
    <VStack gap="8" width="full" alignItems="left">
      <Heading size="5xl">{t("about_regulations.title")}</Heading>
      {aboutRegulationsItems.map((item) => (
        <Card.Root key={item.id}>
          <Card.Body>
            <Card.Title>{item.title}</Card.Title>
            <ChakraMarkdown paragraphAs={Card.Description}>
              {item.contentMarkdown}
            </ChakraMarkdown>
          </Card.Body>
        </Card.Root>
      ))}
    </VStack>
  );
}
