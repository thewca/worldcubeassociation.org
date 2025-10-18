import { Button, Flex, Link, Text, VStack, Card } from "@chakra-ui/react";
import { MarkdownProse } from "@/components/Markdown";

export default function AnnouncementsCard({
  hero,
  others,
  colorPalette,
}: {
  hero: {
    title: string;
    postedBy: string;
    postedAt: string;
    markdown: string;
    fullLink: string;
  };
  others: { title: string; href: string }[];
  colorPalette: string;
}) {
  return (
    <Flex direction="column" gap={3} width="full">
      {/* HERO ANNOUNCEMENT */}
      <Card.Root
        variant="info"
        flexDirection="column"
        overflow="hidden"
        colorPalette={colorPalette}
        flex="2"
      >
        <Card.Body bg="colorPalette.textBox.bg" color="colorPalette.textBox.text">
          <Card.Title textStyle="h2">{hero.title}</Card.Title>
          <Text textStyle="s2">
            Posted by {hero.postedBy} · {hero.postedAt}
          </Text>
          <MarkdownProse content={hero.markdown} textStyle="body" color="colorPalette.textBox.text" />
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
            colorPalette={colorPalette}
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
