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

export default async function Documents() {
  const payload = await getPayload({ config });

  const documentsResult = await payload.find({
    collection: "documents",
    limit: 0,
  });

  const documents = documentsResult.docs;

  if (documents.length === 0) {
    return <Heading>No documents found. Add some</Heading>;
  }

  const [categorizedRaw, uncategorized] = _.partition(documents, "category");
  const categorized = _.groupBy(categorizedRaw, "category");

  return (
    <Container>
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
                  <List.Root pl={"10"}>
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
