"use server";

import { Container, Heading, VStack, Card, Text } from "@chakra-ui/react";
import { getPayload } from "payload";
import config from "@payload-config";
import { MarkdownProse } from "@/components/Markdown";
import { getT } from "@/lib/i18n/get18n";

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
          <Card.Root key={item.id}>
            <Card.Body>
              <Card.Title>{item.title}</Card.Title>
              <Card.Description>
                <MarkdownProse
                  key={item.id}
                  content={item.contentMarkdown!}
                  as={Text}
                />
              </Card.Description>
            </Card.Body>
          </Card.Root>
        ))}
      </VStack>
    </Container>
  );
}
