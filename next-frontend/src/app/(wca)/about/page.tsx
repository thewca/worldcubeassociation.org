"use server";

import { getPayload } from "payload";
import config from "@payload-config";
import { Card, Container, Heading, VStack } from "@chakra-ui/react";
import { MarkdownProse } from "@/components/Markdown";

export default async function About() {
  const payload = await getPayload({ config });

  const aboutResult = await payload.find({
    collection: "aboutUsItem",
    limit: 0,
  });

  const aboutItems = aboutResult.docs;

  if (aboutItems.length === 0) {
    return <Heading> No About Items, add some!</Heading>;
  }

  return (
    <Container>
      <VStack gap="8" width="full" pt="8" alignItems="left">
        <Heading size="5xl">About Us</Heading>
        {aboutItems.toReversed().map((item) => (
          <Card.Root key={item.id}>
            <Card.Title>
              {item.title && <Heading size="xl">{item.title}</Heading>}
            </Card.Title>
            <Card.Body>
              <MarkdownProse content={item.contentMarkdown!} />
            </Card.Body>
          </Card.Root>
        ))}
      </VStack>
    </Container>
  );
}
