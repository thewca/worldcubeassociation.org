import { Text, Accordion, HStack, Stack } from "@chakra-ui/react";
import { MarkdownProse } from "@/components/Markdown";
import { Announcement, User } from "@/types/payload";
import { getMediumDateString } from "@/lib/wca/dates";

function AnnouncementItem({ announcement }: { announcement: Announcement }) {
  const publishedByUser = announcement.publishedBy as User;

  return (
    <Accordion.Item value={announcement.id} layerStyle="fill.deep">
      <Accordion.ItemTrigger _open={{ textStyle: "h2" }}>
        <Accordion.ItemIndicator _open={{ display: "none" }} />
        <Stack gap={1} alignItems="flex-start">
          <Text textStyle="s1">{announcement.title}</Text>
          <HStack textStyle="xs" gap={2}>
            <Text>{publishedByUser.name}</Text>
            <Text>·</Text>
            <Text>{getMediumDateString(announcement.publishAt)}</Text>
          </HStack>
        </Stack>
      </Accordion.ItemTrigger>
      <Accordion.ItemContent>
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
    <Accordion.Root
      variant="card"
      defaultValue={[hero.id]}
      colorPalette={colorPalette}
    >
      <AnnouncementItem announcement={hero} />

      {others.map((announcement) => (
        <AnnouncementItem key={announcement.id} announcement={announcement} />
      ))}
    </Accordion.Root>
  );
}
