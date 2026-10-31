import { io } from "next/cache";
import { Heading, SimpleGrid, VStack } from "@chakra-ui/react";
import { Metadata } from "next";
import { getCachedGlobal } from "@/lib/payload/globals";
import { getT } from "@/lib/i18n/get18n";
import ExecutiveCard from "@/components/executives/ExecutiveCard";
import { ChakraMarkdown } from "@/components/Markdown";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();

  return {
    title: t("page.executives.title"),
  };
}

export default async function ExecutivesPage() {
  // See logo/page.tsx: keeps the Payload read out of the build-time prerender.
  await io();

  const executivesPage = await getCachedGlobal("executives-page");

  return (
    <VStack gap="8" alignItems="stretch" py="8">
      <Heading size="5xl">{executivesPage.title}</Heading>
      <ChakraMarkdown>{executivesPage.introMarkdown}</ChakraMarkdown>
      <SimpleGrid columns={{ base: 1, md: 3, xl: 4 }} gap="6">
        {executivesPage.executives.map((executive) => (
          <ExecutiveCard
            key={executive.id}
            executive={executive}
            showsImages={executivesPage.showsImages}
          />
        ))}
      </SimpleGrid>
    </VStack>
  );
}
