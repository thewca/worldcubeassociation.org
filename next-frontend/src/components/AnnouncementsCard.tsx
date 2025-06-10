import { Button, Flex, Link, Text, VStack, Card } from "@chakra-ui/react";
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
    <Flex direction="column" gap={3} width="full">
      {/* HERO ANNOUNCEMENT */}
      <Card.Root
        variant="info"
        flexDirection="column"
        overflow="hidden"
        colorPalette="grey"
        flex="2"
      >
        <Card.Body bg="blue.100" color="blue.fg">
          <Card.Title>{hero.title}</Card.Title>
          <Text fontSize="sm" mt={1}>
            Posted by {hero.postedBy} · {hero.postedAt}
          </Text>
          <MarkdownProse content={hero.markdown} />
          <Button mt="auto" mr="auto" asChild>
            <Link href={hero.fullLink}>Read full article</Link>
          </Button>
        </Card.Body>
      </Card.Root>

      {/* OTHER ANNOUNCEMENTS */}
      <VStack align="start" gap={3}>
        {others.map((a, i) => (
          <Button
            key={i}
            asChild
            variant="solid"
            width="full"
            justifyContent="flex-start"
          >
            <Link href={a.href}>{a.title}</Link>
          </Button>
        ))}
        <Button
          asChild
          variant="solid"
          width="full"
          justifyContent="flex-start"
        >
          <Link href="#">See All Announcements</Link>
        </Button>
      </VStack>
    </Flex>
  );
}
