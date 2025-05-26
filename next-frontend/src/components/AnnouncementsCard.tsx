import { Box, Button, Flex, Heading, Link, Text, VStack, Card, Separator } from "@chakra-ui/react";
import { MarkdownProse } from "@/components/Markdown";

export default function AnnouncementsCard({
  hero,
  others,
}: {
  hero: {
    title: string;
    postedBy: string;
    postedAt: string;
    markdown: string;
    fullLink: string;
  };
  others: { title: string; href: string }[];
}) {
  return (
    <Flex direction="column" gap={3}>
      {/* HERO ANNOUNCEMENT */}
      <Card.Root
        variant="info"
        flexDirection="column"
        overflow="hidden"
        colorPalette="grey"
        flex="2"
      >
        <Card.Body bg="blue.100" color="blue.fg">
          <Card.Title >{hero.title}</Card.Title>
          <Text fontSize="sm" mt={1}>
            Posted by {hero.postedBy} · {hero.postedAt}
          </Text>
          <Card.Description>
            <MarkdownProse content={hero.markdown}/>
          </Card.Description>
          <Button mt="auto" mr="auto" as={Link} href={hero.fullLink}>
            Read full article
          </Button>
        </Card.Body>
      </Card.Root>

      {/* OTHER ANNOUNCEMENTS */}
        <VStack align="start" spacing={3}>
        {others.map((a, i) => (
            <Button
                key={i}
                href={a.href}
                variant="solid"
                width="full"
                justifyContent="flex-start"
            >
            {a.title}
            </Button>
        ))}
            <Button
                href="#"
                variant="solid"
                width="full"
                justifyContent="flex-start"
            >
            See All Announcements
            </Button>
        </VStack>
    </Flex>
  );
}
