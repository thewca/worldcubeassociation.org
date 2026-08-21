import { getPayload } from "payload";
import config from "@payload-config";
import { connection } from "next/server";
import { Container, Heading, VStack, Box } from "@chakra-ui/react";
import { ChakraMarkdown } from "@/components/Markdown";
import { Metadata } from "next";
import { getT } from "@/lib/i18n/get18n";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();

  return {
    title: t("layouts.navigation.disclaimer"),
  };
}
export default async function Disclaimer() {
  await connection();

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
            <ChakraMarkdown>{item.contentMarkdown}</ChakraMarkdown>
          </Box>
        ))}
      </VStack>
    </Container>
  );
}
