import { io } from "next/cache";
import { getCachedGlobal } from "@/lib/payload/globals";
import { Heading, VStack } from "@chakra-ui/react";
import { CallToActionBlock } from "@/components/about/CallToAction";
import Quote from "@/components/Quote";
import AboutUsItem from "@/components/about/AboutUsItem";
import { Media } from "@/types/payload";
import { Metadata } from "next";
import { getStaticT } from "@/lib/i18n/getStaticT";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getStaticT();

  return {
    title: t("layouts.navigation.about"),
  };
}
export default async function About() {
  // `io()` marks the boundary the build-time prerender stops at, so the Payload read below
  // never runs while building, where MongoDB is unreachable. It has to stay out here rather
  // than inside `getCachedGlobal`: within a `"use cache"` scope `io()` resolves immediately.
  await io();

  const aboutPage = await getCachedGlobal("about-us-page");

  const aboutItems = aboutPage.blocks;

  if (aboutItems.length === 0) {
    return <Heading>No About Items, add some!</Heading>;
  }

  return (
    <VStack gap="8" width="full" alignItems="left">
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
  );
}
