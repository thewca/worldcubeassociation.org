import { Accordion, Card, Heading, Tabs, VStack } from "@chakra-ui/react";
import { io } from "next/cache";
import { getCachedGlobal } from "@/lib/payload/globals";
import { FaqCategory, FaqQuestion } from "@/types/payload";
import { ChakraMarkdown } from "@/components/Markdown";
import { uniqBy } from "lodash";
import { Metadata } from "next";
import { getStaticT } from "@/lib/i18n/getStaticT";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getStaticT();

  return {
    title: t("faq.title"),
  };
}

export default async function FAQ() {
  // `io()` marks the boundary the build-time prerender stops at, so the Payload read below
  // never runs while building, where MongoDB is unreachable. It has to stay out here rather
  // than inside `getCachedGlobal`: within a `"use cache"` scope `io()` resolves immediately.
  await io();

  const faqPage = await getCachedGlobal("faq-page", 2);
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
    <VStack gap="8" width="full" alignItems="left">
      <Card.Root maxW="40em">
        <Card.Body>
          <Card.Title textStyle="h1">Frequently Asked Questions</Card.Title>
          {faqPage.introTextMarkdown ? (
            <ChakraMarkdown
              headingAs={Card.Title}
              paragraphAs={Card.Description}
              textStyle="body"
            >
              {faqPage.introTextMarkdown}
            </ChakraMarkdown>
          ) : (
            <Card.Description>No Intro text, add it!</Card.Description>
          )}
        </Card.Body>
      </Card.Root>
      <Card.Root borderWidth={0} bg="transparent">
        <Card.Body paddingX={0}>
          <Tabs.Root
            variant="subtle"
            fitContent
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
                <Tabs.Content key={category.id} value={category.id.toString()}>
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
                            <ChakraMarkdown>
                              {question.answerRichtextMarkdown ||
                                question.answer}
                            </ChakraMarkdown>
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
  );
}
