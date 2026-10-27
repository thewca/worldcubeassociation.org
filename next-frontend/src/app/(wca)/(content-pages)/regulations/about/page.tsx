import { Card, Heading, VStack } from "@chakra-ui/react";
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
            <ChakraMarkdown
              paragraphAs={Card.Description}
              listProps={{ textStyle: "body" }}
            >
              {item.contentMarkdown}
            </ChakraMarkdown>
          </Card.Body>
        </Card.Root>
      ))}
    </VStack>
  );
}
