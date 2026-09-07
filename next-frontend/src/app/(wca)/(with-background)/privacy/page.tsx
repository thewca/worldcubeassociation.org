import { getPayload } from "payload";
import config from "@payload-config";
import { Container, Heading, VStack } from "@chakra-ui/react";
import MarkdownCard from "@/components/MarkdownCard";
import { Metadata } from "next";
import { getT } from "@/lib/i18n/get18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();

  return {
    title: t("layouts.navigation.privacy"),
  };
}

export default async function Privacy() {
  const payload = await getPayload({ config });

  const privacyPage = await payload.findGlobal({
    slug: "privacy-page",
  });

  const privacyItems = privacyPage.blocks;

  if (privacyItems.length === 0) {
    return <Heading>No Privacy Items, add some!</Heading>;
  }

  return (
    <Container bg="bg">
      <VStack gap="8" width="full" pt="8" alignItems="left">
        <Heading size="5xl">WCA Privacy Statement</Heading>
        <MarkdownCard>{privacyPage.preambleMarkdown}</MarkdownCard>
        {privacyItems.map((item) => (
          <MarkdownCard key={item.id} title={item.title}>
            {item.contentMarkdown}
          </MarkdownCard>
        ))}
      </VStack>
    </Container>
  );
}
