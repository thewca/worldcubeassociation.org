import { io } from "next/cache";
import { getCachedGlobal } from "@/lib/payload/globals";
import { Heading, HStack, Image, Text, VStack } from "@chakra-ui/react";
import { getT } from "@/lib/i18n/get18n";
import { ChakraMarkdown } from "@/components/Markdown";
import { Media } from "@/types/payload";
import LogoDownload from "@/app/(wca)/(with-background)/logo/download";
import { Fragment } from "react";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();

  return {
    title: t("logo.title"),
  };
}

export default async function LogoPage() {
  // `io()` marks the boundary the build-time prerender stops at, so the Payload read below
  // never runs while building, where MongoDB is unreachable. It has to stay out here rather
  // than inside `getCachedGlobal`: within a `"use cache"` scope `io()` resolves immediately.
  await io();

  const logoPage = await getCachedGlobal("logo-page");

  const logoItems = logoPage.blocks;

  if (logoItems.length === 0) {
    return <Heading>No Logo Items, add some!</Heading>;
  }

  const { t } = await getT();

  return (
    <VStack gap="4" alignItems="left">
      <Heading size="5xl">{t("logo.title")}</Heading>
      {logoItems.map((item) => {
        switch (item.blockType) {
          case "paragraph": {
            return (
              <Fragment key={item.id}>
                {item.title && (
                  <Heading size="2xl" mt="8">
                    {item.title}
                  </Heading>
                )}
                <ChakraMarkdown>{item.contentMarkdown}</ChakraMarkdown>
              </Fragment>
            );
          }
          case "logoDownload": {
            return <LogoDownload key={item.id} logoDownloadLink={item.url} />;
          }
          case "logoVariant": {
            return (
              <Fragment key={item.id}>
                <Heading size="2xl" mt="8">
                  {item.title}
                </Heading>
                <Text>{item.caption}</Text>
                <HStack w="full" mt="4">
                  {item.images.map((value) => {
                    const image = value.image as Media;
                    return (
                      <Image
                        src={image.url!}
                        alt={item.caption}
                        key={image.id}
                        w="100%"
                        maxW={item.logoOnly ? "150px" : "400px"}
                        bg={value.darkBackground ? "black" : "white"}
                      />
                    );
                  })}
                </HStack>
              </Fragment>
            );
          }
        }
      })}
    </VStack>
  );
}
