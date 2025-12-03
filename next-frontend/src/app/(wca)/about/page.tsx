"use server";

import { getPayload } from "payload";
import config from "@payload-config";
import { Container, Heading, VStack } from "@chakra-ui/react";
import { CallToActionBlock } from "@/components/about/CallToAction";
import Quote from "@/components/Quote";
import AboutUsItem from "@/components/about/AboutUsItem";
import { Media } from "@/types/payload";

export default async function About() {
  const payload = await getPayload({ config });

  const aboutPage = await payload.findGlobal({ slug: "about-us-page" });

  const aboutItems = aboutPage.blocks;

  if (aboutItems.length === 0) {
    return <Heading>No About Items, add some!</Heading>;
  }

  return (
    <Container bg="bg">
      <VStack gap="8" width="full" pt="8" alignItems="left">
        <Heading size="5xl">About Us</Heading>
        {aboutItems.map((item) => {
          switch (item.blockType) {
            case "callToAction":
              return (
                <CallToActionBlock
                  key={item.id}
                  content={item.contentMarkdown!}
                  buttons={item.buttons}
                />
              );
            case "quote": {
              return (
                <Quote
                  key={item.id}
                  content={item.contentMarkdown!}
                  author={item.quotedPerson}
                />
              );
            }
            case "simpleItem": {
              return (
                <AboutUsItem
                  key={item.id}
                  title={item.title}
                  contentMarkdown={item.contentMarkdown!}
                  image={item.image! as Media}
                />
              );
            }
          }
        })}
      </VStack>
    </Container>
  );
}
