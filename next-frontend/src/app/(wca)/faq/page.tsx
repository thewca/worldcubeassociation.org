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
import { Metadata } from "next";
import { getT } from "@/lib/i18n/get18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();

  return {
    title: t("faq.title"),
  };
}

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
    <Container paddingTop="8" bg="bg">
      <VStack gap="8" width="full" alignItems="left">
        <Card.Root maxW="40em">
          <Card.Body>
            <Card.Title textStyle="h1">Frequently Asked Questions</Card.Title>
            {faqPage.introTextMarkdown ? (
              <MarkdownProse
                content={faqPage.introTextMarkdown}
                textStyle="body"
              />
            ) : (
              <Text>No Intro text, add it!</Text>
            )}
          </Card.Body>
        </Card.Root>
        <Card.Root borderWidth={0} bg="transparent">
          <Card.Body paddingX={0}>
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
                    colorPalette={category.colorPalette}
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
                      variant="card"
                      width="full"
                    >
                      {questions.map((question) => (
                        <Accordion.Item
                          key={question.id}
                          value={question.id.toString()}
                          layerStyle="outline.solid"
                          borderColor="border"
                          bg="bg.panel"
                        >
                          <Accordion.ItemTrigger
                            textStyle="s1"
                            _open={{
                              bgImage: `linear-gradient(90deg, {colors.${category.colorPalette}.subtle}, {colors.bg.panel})`,
                              borderBottomRadius: 0,
                            }}
                            _hover={{
                              bgImage: `linear-gradient(90deg, {colors.${category.colorPalette}.subtle}, {colors.bg.panel})`,
                            }}
                          >
                            {question.question}
                            <Accordion.ItemIndicator />
                          </Accordion.ItemTrigger>
                          <Accordion.ItemContent textStyle="body">
                            <Accordion.ItemBody>
                              {question.answer}
                            </Accordion.ItemBody>
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
