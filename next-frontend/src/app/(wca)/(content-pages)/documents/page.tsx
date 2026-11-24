import {
  Accordion,
  Heading,
  Link,
  LinkBox,
  LinkOverlay,
  List,
  VStack,
} from "@chakra-ui/react";
import { getCachedGlobal } from "@/lib/payload/globals";
import _ from "lodash";
import IconDisplay from "@/components/IconDisplay";
import { Metadata } from "next";
import { getT } from "@/lib/i18n/get18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();

  return {
    title: t("documents.title"),
  };
}
export default async function Documents() {
  const { t, lng } = await getT();

  const documentsResult = await getCachedGlobal("documents-page", lng);

  const { documents } = documentsResult;

  if (documents.length === 0) {
    return <Heading>No documents found. Add some</Heading>;
  }

  const [categorizedRaw, uncategorized] = _.partition(documents, "category");
  const categorized = _.groupBy(categorizedRaw, "category");

  return (
    <VStack gap="8" alignItems="left">
      <Heading size="5xl">Documents</Heading>
      <Accordion.Root variant="enclosed" multiple>
        {uncategorized.map((doc) => (
          <Accordion.Item key={doc.id} value={doc.title}>
            <LinkBox asChild>
              <Accordion.ItemTrigger>
                <LinkOverlay asChild>
                  <Link href={doc.link} variant="underline">
                    <IconDisplay name={doc.icon} /> {doc.title}
                  </Link>
                </LinkOverlay>
              </Accordion.ItemTrigger>
            </LinkBox>
          </Accordion.Item>
        ))}
        {Object.entries(categorized).map(([category, docs]) => (
          <Accordion.Item key={category} value={category}>
            <Accordion.ItemTrigger>
              <IconDisplay name="List" /> {t(`documents.${category}`)}
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
              <Accordion.ItemBody>
                <List.Root ps="10">
                  {docs
                    .toSorted((a, b) => a.title.localeCompare(b.title))
                    .map((doc) => (
                      <List.Item key={doc.id}>
                        <Link href={doc.link} variant="underline">
                          {doc.title}
                        </Link>
                      </List.Item>
                    ))}
                </List.Root>
              </Accordion.ItemBody>
            </Accordion.ItemContent>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </VStack>
  );
}
