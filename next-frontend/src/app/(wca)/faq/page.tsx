"use server";

import {
  VStack,
  Container,
  Card,
  Heading,
  Tabs,
  Accordion,
} from "@chakra-ui/react";
import { getPayload } from "payload";
import config from "@payload-config";
import { FaqQuestion } from "@/types/payload";

export default async function FAQ() {
  const payload = await getPayload({ config });

  const faqCategoriesResult = await payload.find({
    collection: "faqCategories",
    limit: 0,
    depth: 1,
  });

  const faqCategories = faqCategoriesResult.docs;

  return (
    <Container>
      <VStack gap="8" width="full" pt="8" alignItems="left">
        <Heading size="5xl"> Frequently Asked Questions</Heading>
        <Card.Root maxW="40em">
          <Card.Body>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat.
          </Card.Body>
        </Card.Root>
        <Card.Root variant="hero" overflow="hidden">
          <Card.Body bg="bg">
            <Tabs.Root
              variant="subtle"
              fitted
              defaultValue={faqCategories[0].id.toString()}
              width="full"
            >
              <Tabs.List>
                {faqCategories.map((category) => (
                  <Tabs.Trigger
                    key={category.id}
                    value={category.id.toString()}
                  >
                    {category.title}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>
              {faqCategories.map((category) => (
                <Tabs.Content key={category.id} value={category.id.toString()}>
                  <Accordion.Root
                    multiple
                    collapsible
                    variant="subtle"
                    width="full"
                  >
                    {category
                      .relatedQuestions!.docs!.map(
                        (question) => question as FaqQuestion,
                      )
                      .map((question) => (
                        <Accordion.Item
                          key={question.id}
                          value={question.id.toString()}
                        >
                          <Accordion.ItemTrigger
                            colorPalette={category.colorPalette}
                          >
                            {question.question}
                          </Accordion.ItemTrigger>
                          <Accordion.ItemContent>
                            {question.answer}
                          </Accordion.ItemContent>
                        </Accordion.Item>
                      ))}
                  </Accordion.Root>
                </Tabs.Content>
              ))}
            </Tabs.Root>
          </Card.Body>
        </Card.Root>
      </VStack>
    </Container>
  );
}
