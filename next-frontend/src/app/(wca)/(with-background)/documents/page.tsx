import {
  Accordion,
  Heading,
  Link,
  LinkBox,
  LinkOverlay,
  List,
  VStack,
} from "@chakra-ui/react";
import { io } from "next/cache";
import { getCachedGlobal } from "@/lib/payload/globals";
import _ from "lodash";
import IconDisplay from "@/components/IconDisplay";
import { Document } from "@/types/payload";
import { Metadata } from "next";
import { getStaticT } from "@/lib/i18n/getStaticT";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getStaticT();

  return {
    title: t("documents.title"),
  };
}
export default async function Documents() {
  // `io()` marks the boundary the build-time prerender stops at, so the Payload read below
  // never runs while building, where MongoDB is unreachable. It has to stay out here rather
  // than inside `getCachedGlobal`: within a `"use cache"` scope `io()` resolves immediately.
  await io();

  const documentsResult = await getCachedGlobal("documents-page");

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
    <VStack gap="8" alignItems="left">
      <Heading size="5xl">Documents</Heading>
      <Accordion.Root variant="enclosed" multiple>
        {uncategorized.map((doc) => (
          <Accordion.Item key={doc.title} value={doc.title}>
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
              <IconDisplay name="List" /> {category}
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
              <Accordion.ItemBody>
                <List.Root pl="10">
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
