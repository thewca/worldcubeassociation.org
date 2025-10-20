import { Button, Flex, Link, VStack, Card } from "@chakra-ui/react";
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
        flexDirection="column"
        overflow="hidden"
        colorPalette={colorPalette}
        coloredBg
        flex="2"
      >
        <Card.Header>
          <Card.Title textStyle="h2">{hero.title}</Card.Title>
          <Card.Description textStyle="s2">
            Posted by {hero.postedBy} · {hero.postedAt}
          </Card.Description>
        </Card.Header>
        <Card.Body>
          <MarkdownProse
            as={Card.Description}
            content={hero.markdown}
            textStyle="body"
          />
        </Card.Body>
        <Card.Footer>
          <Button mt="auto" mr="auto" asChild>
            <Link href={hero.fullLink}>Read full article</Link>
          </Button>
        </Card.Footer>
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
