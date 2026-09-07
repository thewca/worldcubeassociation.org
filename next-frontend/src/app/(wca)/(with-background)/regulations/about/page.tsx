"use server";

import { Container, Heading, VStack } from "@chakra-ui/react";
import { getPayload } from "payload";
import config from "@payload-config";
import MarkdownCard from "@/components/MarkdownCard";
import { getT } from "@/lib/i18n/get18n";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();

  return {
    title: t("about_regulations.title"),
  };
}

export default async function AboutTheRegulations() {
  const payload = await getPayload({ config });

  const aboutRegulations = await payload.findGlobal({
    slug: "about-regulations-page",
  });

  const aboutRegulationsItems = aboutRegulations.blocks;

  if (aboutRegulationsItems.length === 0) {
    return <Heading>No About Regulations Items, add some!</Heading>;
  }

  const { t } = await getT();

  return (
    <Container bg="bg">
      <VStack gap="8" width="full" pt="8" alignItems="left">
        <Heading size="5xl">{t("about_regulations.title")}</Heading>
        {aboutRegulationsItems.map((item) => (
          <MarkdownCard key={item.id} title={item.title}>
            {item.contentMarkdown}
          </MarkdownCard>
        ))}
      </VStack>
    </Container>
  );
}
