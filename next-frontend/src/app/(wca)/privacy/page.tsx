import { getPayload } from "payload";
import config from "@payload-config";
import { Container, Heading, VStack, Box } from "@chakra-ui/react";
import { MarkdownProse } from "@/components/Markdown";
import { Prose } from "@/components/ui/prose";

export default async function Privacy() {
  const payload = await getPayload({ config });

  const privacyPage = await payload.findGlobal({
    slug: "privacy-page",
  });

  const privacyItems = privacyPage.blocks;

  if (privacyItems.length === 0) {
    return <Heading>No Privacy Items, add some!</Heading>;
  }

  return (
    <Container>
      <VStack gap="8" width="full" pt="8" alignItems="left">
        <Heading size="5xl">WCA Privacy Statement</Heading>
        <Prose>
          In this privacy statement we explain how we collect and use your
          personal data. The statement applies to all the personal data that we
          use for the services that we provide.
        </Prose>
        {privacyItems.map((item) => (
          <Box key={item.id}>
            <Heading size="xl">{item.title}</Heading>
            <MarkdownProse content={item.contentMarkdown!} />
          </Box>
        ))}
      </VStack>
    </Container>
  );
}
