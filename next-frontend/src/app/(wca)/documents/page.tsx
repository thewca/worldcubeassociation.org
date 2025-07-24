import {
  VStack,
  Container,
  Heading,
  Accordion,
  Link,
  Box,
  Text,
  List,
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
      <VStack gap="8" width="full" pt="8" alignItems="left">
        <Heading size="5xl">Documents</Heading>
        <Accordion.Root>
          {uncategorized.map((doc) => (
            <Accordion.Item
              p={"1"}
              key={doc.title}
              value={doc.title}
              border="1px solid"
              borderColor="gray.200"
              borderRadius="md"
            >
              <Accordion.ItemTrigger px={4} py={2}>
                <Box flex="1" textAlign="left" fontWeight="medium">
                  <Link
                    key={doc.id}
                    href={doc.link}
                    display="flex"
                    alignItems="center"
                    gap={2}
                    color="blue.600"
                    variant="underline"
                  >
                    <IconDisplay name={doc.icon} /> {doc.title}
                  </Link>
                </Box>
              </Accordion.ItemTrigger>
            </Accordion.Item>
          ))}
          {Object.entries(categorized).map(([category, docs]) => (
            <Accordion.Item
              p={"1"}
              key={category}
              value={category}
              border="1px solid"
              borderColor="gray.200"
              borderRadius="md"
            >
              <Accordion.ItemTrigger px={4} py={2}>
                <Box flex="1" textAlign="left" fontWeight="medium">
                  <IconDisplay name="List" /> {category}
                </Box>
              </Accordion.ItemTrigger>
              <Accordion.ItemContent pb={4}>
                <VStack align="stretch">
                  <List.Root pl={"10"}>
                    {docs
                      .toSorted((a, b) => a.title.localeCompare(b.title))
                      .map((doc) => (
                        <List.Item key={doc.id}>
                          <Link
                            href={doc.link}
                            display="flex"
                            alignItems="center"
                            gap={2}
                            color="blue.600"
                            variant="underline"
                          >
                            <Text>{doc.title}</Text>
                          </Link>
                        </List.Item>
                      ))}
                  </List.Root>
                </VStack>
              </Accordion.ItemContent>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </VStack>
    </Container>
  );
}
