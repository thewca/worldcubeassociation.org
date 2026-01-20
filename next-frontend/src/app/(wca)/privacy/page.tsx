import { getPayload } from "payload";
import config from "@payload-config";
import { Container, Heading, VStack, Box } from "@chakra-ui/react";
import { MarkdownProse } from "@/components/Markdown";
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
        <MarkdownProse content={privacyPage.preambleMarkdown!} />
        {privacyItems.map((item) => (
          <Box key={item.id}>
            <Heading size="xl">{item.title}</Heading>
            <MarkdownProse content={item.contentMarkdown!} />
          </Box>
        ))}
      </VStack>
    </Container>
  );
}
