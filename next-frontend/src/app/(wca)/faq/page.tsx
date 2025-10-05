"use server";

import {
  VStack,
  Container,
  Card,
  Heading,
  Tabs,
  Accordion,
  Text,
} from "@chakra-ui/react";
import { getPayload } from "payload";
import config from "@payload-config";
import { FaqCategory, FaqQuestion } from "@/types/payload";
import { MarkdownProse } from "@/components/Markdown";
import { uniqBy } from "lodash";

export default async function FAQ() {
  const payload = await getPayload({ config });

  const faqPage = await payload.findGlobal({ slug: "faq-page", depth: 2 });
  const faqQuestionsRaw = faqPage.questions;

  if (faqQuestionsRaw.length === 0) {
    return <Heading>No FAQ Categories, add some!</Heading>;
  }

  const faqQuestions = faqQuestionsRaw.map(
    (item) => item.faqQuestion as FaqQuestion,
  );

  const allCategories = faqQuestions.map(
    (item) => item.category as FaqCategory,
  );

  const faqCategories = uniqBy(allCategories, "id");

  return (
    <Container>
      <VStack gap="8" width="full" pt="8" alignItems="left">
        <Heading size="5xl"> Frequently Asked Questions</Heading>
        <Card.Root maxW="40em">
          <Card.Body>
            {faqPage.introTextMarkdown ? (
              <MarkdownProse content={faqPage.introTextMarkdown} />
            ) : (
              <Text>No Intro text, add it!</Text>
            )}
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
                    value={category.id!.toString()}
                  >
                    {category.title}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>
              {faqCategories.map((category) => {
                const questions = faqQuestions.filter(
                  (faqQuestion) =>
                    (faqQuestion.category as FaqCategory).id === category.id,
                );
                return (
                  <Tabs.Content
                    key={category.id}
                    value={category.id.toString()}
                  >
                    <Accordion.Root
                      multiple
                      collapsible
                      variant="subtle"
                      width="full"
                    >
                      {questions.map((question) => (
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
                );
              })}
            </Tabs.Root>
          </Card.Body>
        </Card.Root>
      </VStack>
    </Container>
  );
}
