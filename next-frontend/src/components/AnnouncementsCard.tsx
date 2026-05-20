import { Accordion, Stack, Text } from "@chakra-ui/react";
import { ChakraMarkdown } from "@/components/Markdown";
import { Announcement } from "@/types/payload";
import { getMediumDateString } from "@/lib/wca/dates";

function AnnouncementItem({ announcement }: { announcement: Announcement }) {
  return (
    <Accordion.Item value={announcement.id} layerStyle="fill.deep">
      <Accordion.ItemTrigger _open={{ textStyle: "h2" }}>
        <Accordion.ItemIndicator _open={{ display: "none" }} />
        <Stack gap={1} alignItems="flex-start">
          <Text textStyle="s1">{announcement.title}</Text>
          <Text>{getMediumDateString(announcement.publishAt)}</Text>
        </Stack>
      </Accordion.ItemTrigger>
      <Accordion.ItemContent>
        <ChakraMarkdown paragraphAs={Accordion.ItemBody} textStyle="body">
          {announcement.contentMarkdown}
        </ChakraMarkdown>
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
