import { getPayload } from "payload";
import config from "@payload-config";
import {
  Card,
  Container,
  Heading,
  HStack,
  Image,
  VStack,
} from "@chakra-ui/react";
import { getT } from "@/lib/i18n/get18n";
import MarkdownCard from "@/components/MarkdownCard";
import { Media } from "@/types/payload";
import LogoDownload from "@/app/(wca)/(with-background)/logo/download";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();

  return {
    title: t("logo.title"),
  };
}

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
      <VStack gap="4" alignItems="left">
        <Heading size="5xl">{t("logo.title")}</Heading>
        {logoItems.map((item) => {
          switch (item.blockType) {
            case "paragraph": {
              return (
                <MarkdownCard key={item.id} title={item.title}>
                  {item.contentMarkdown}
                </MarkdownCard>
              );
            }
            case "logoDownload": {
              return <LogoDownload key={item.id} logoDownloadLink={item.url} />;
            }
            case "logoVariant": {
              return (
                <Card.Root key={item.id}>
                  <Card.Body>
                    <Card.Title>{item.title}</Card.Title>
                    <Card.Description>{item.caption}</Card.Description>
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
                  </Card.Body>
                </Card.Root>
              );
            }
          }
        })}
      </VStack>
    </Container>
  );
}
