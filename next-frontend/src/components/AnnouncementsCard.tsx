import { Text, Accordion } from "@chakra-ui/react";
import { MarkdownProse } from "@/components/Markdown";
import { Announcement, User } from "@/types/payload";

function AnnouncementItem({ announcement }: { announcement: Announcement }) {
  const publishedByUser = announcement.publishedBy as User;

  return (
    <Accordion.Item value={announcement.id}>
      <Accordion.ItemTrigger _open={{ textStyle: "h2" }}>
        {announcement.title}
      </Accordion.ItemTrigger>
      <Accordion.ItemContent>
        <Text textStyle="s2">
          Posted by {publishedByUser.name} · {announcement.publishedAt}
        </Text>
        <MarkdownProse
          as={Accordion.ItemBody}
          content={announcement.contentMarkdown!}
          textStyle="body"
        />
      </Accordion.ItemContent>
    </Accordion.Item>
  );
}

export default function AnnouncementsCard({
  hero,
  others = [],
  colorPalette,
}: {
  hero: Announcement;
  others: Announcement[];
  colorPalette: string;
}) {
  return (
    <Accordion.Root variant="enclosed" collapsible defaultValue={[hero.id]} colorPalette={colorPalette}>
      <AnnouncementItem announcement={hero} />

      {others.map((announcement) => (
        <AnnouncementItem key={announcement.id} announcement={announcement} />
      ))}
    </Accordion.Root>
  );
}
