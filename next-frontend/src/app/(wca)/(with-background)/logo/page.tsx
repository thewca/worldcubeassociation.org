import { getPayload } from "payload";
import config from "@payload-config";
import { connection } from "next/server";
import {
  Container,
  Heading,
  HStack,
  Image,
  Text,
  VStack,
} from "@chakra-ui/react";
import { getT } from "@/lib/i18n/get18n";
import { ChakraMarkdown } from "@/components/Markdown";
import { Media } from "@/types/payload";
import LogoDownload from "@/app/(wca)/(with-background)/logo/download";
import { Fragment } from "react";
import { Metadata } from "next";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();

  return {
    title: t("logo.title"),
  };
}

export default async function LogoPage() {
  await connection();

  const payload = await getPayload({ config });

  const logoPage = await payload.findGlobal({
    slug: "logo-page",
  });

  const logoItems = logoPage.blocks;

  if (logoItems.length === 0) {
    return <Heading>No Logo Items, add some!</Heading>;
  }

  const { t } = await getT();

  return (
    <Container bg="bg">
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
    </Container>
  );
}
