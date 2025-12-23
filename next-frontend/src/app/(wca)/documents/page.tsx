import {
  VStack,
  Container,
  Heading,
  Accordion,
  Link,
  List,
  LinkBox,
  LinkOverlay,
} from "@chakra-ui/react";
import { getPayload } from "payload";
import config from "@payload-config";
import _ from "lodash";
import IconDisplay from "@/components/IconDisplay";
import { Document } from "@/types/payload";
import { Metadata } from "next";
import { getT } from "@/lib/i18n/get18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();

  return {
    title: t("documents.title"),
  };
}
export default async function Documents() {
  const payload = await getPayload({ config });

  const documentsResult = await payload.findGlobal({
    slug: "documents-page",
  });

  const documentRelation = documentsResult.documents;

  if (documentRelation.length === 0) {
    return <Heading>No documents found. Add some</Heading>;
  }

  const documents = documentRelation.map(
    ({ document }) => document as Document,
  );

  const [categorizedRaw, uncategorized] = _.partition(documents, "category");
  const categorized = _.groupBy(categorizedRaw, "category");

  return (
    <Container bg="bg">
      <VStack gap="8" pt="8" alignItems="left">
        <Heading size="5xl">Documents</Heading>
        <Accordion.Root variant="enclosed" multiple>
          {uncategorized.map((doc) => (
            <Accordion.Item key={doc.title} value={doc.title}>
              <LinkBox asChild>
                <Accordion.ItemTrigger>
                  <LinkOverlay asChild>
                    <Link href={doc.link} color="blue.600" variant="underline">
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
                <IconDisplay name="List" /> {category}
              </Accordion.ItemTrigger>
              <Accordion.ItemContent>
                <Accordion.ItemBody>
                  <List.Root pl="10">
                    {docs
                      .toSorted((a, b) => a.title.localeCompare(b.title))
                      .map((doc) => (
                        <List.Item key={doc.id}>
                          <Link
                            href={doc.link}
                            color="blue.600"
                            variant="underline"
                          >
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
    </Container>
  );
}
