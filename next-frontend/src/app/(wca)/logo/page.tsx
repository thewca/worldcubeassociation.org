import { getPayload } from "payload";
import config from "@payload-config";
import {
  Container,
  Heading,
  HStack,
  Image,
  Text,
  VStack,
} from "@chakra-ui/react";
import { getT } from "@/lib/i18n/get18n";
import { MarkdownProse } from "@/components/Markdown";
import { Media } from "@/types/payload";
import LogoDownload from "@/app/(wca)/logo/download";
import { Fragment } from "react";

export default async function LogoPage() {
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
      <VStack alignItems="left">
        <Heading size="5xl">{t("logo.title")}</Heading>
        {logoItems.map((item) => {
          switch (item.blockType) {
            case "paragraph": {
              return (
                <Fragment key={item.id}>
                  <Heading size="2xl">{item.title}</Heading>
                  <MarkdownProse
                    key={item.id}
                    content={item.contentMarkdown!}
                    as={Text}
                  />
                </Fragment>
              );
            }
            case "logoDownload": {
              return <LogoDownload logoDownloadLink={item.url} />;
            }
            case "logoVariant": {
              return (
                <Fragment key={item.id}>
                  <Heading size="2xl">{item.title}</Heading>
                  <Text>{item.caption}</Text>
                  <HStack w="full">
                    {item.images.map((value) => {
                      const image = value.image as Media;
                      return (
                        <Image
                          src={image.url!}
                          alt={item.caption}
                          key={image.id}
                          w="100%"
                          maxW="400px"
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
