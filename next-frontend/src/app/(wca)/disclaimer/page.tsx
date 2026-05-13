import { getPayload } from "payload";
import config from "@payload-config";
import { Container, Heading, VStack, Box } from "@chakra-ui/react";
import { MarkdownProse } from "@/components/Markdown";
import { Metadata } from "next";
import { getT } from "@/lib/i18n/get18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();

  return {
    title: t("delegates_page.title"),
  };
}
export default async function Disclaimer() {
  const payload = await getPayload({ config });

  const disclaimerPage = await payload.findGlobal({
    slug: "disclaimer-page",
  });

  const disclaimerItems = disclaimerPage.blocks;

  if (disclaimerItems.length === 0) {
    return <Heading>No Disclaimer Items, add some!</Heading>;
  }

  return (
    <Container bg="bg">
      <VStack gap="8" width="full" pt="8" alignItems="left">
        <Heading size="5xl">Disclaimer</Heading>
        {disclaimerItems.map((item) => (
          <Box key={item.id}>
            {item.title && <Heading size="xl">{item.title}</Heading>}
            <MarkdownProse content={item.contentMarkdown!} />
          </Box>
        ))}
      </VStack>
    </Container>
  );
}
