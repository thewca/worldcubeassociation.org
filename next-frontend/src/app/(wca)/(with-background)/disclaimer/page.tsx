import { getPayload } from "payload";
import config from "@payload-config";
import { connection } from "next/server";
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
