import { Accordion, Link as ChakraLink, Stack, Text } from "@chakra-ui/react";
import { ChakraMarkdown } from "@/components/Markdown";
import { Announcement } from "@/types/payload";
import { LuChevronsRight } from "react-icons/lu";
import { getMediumDateString } from "@/lib/wca/dates";

function AnnouncementItem({ announcement }: { announcement: Announcement }) {
  return (
    <Accordion.Item
      value={announcement.id}
      layerStyle="fill.subtle"
      _open={{ layerStyle: "card.pastel" }}
    >
      <Accordion.ItemTrigger _open={{ textStyle: "h2" }}>
        <Accordion.ItemIndicator _open={{ display: "none" }} />
        <Stack gap={1} alignItems="flex-start">
          <Text textStyle="s1">{announcement.title}</Text>
          <Text>{getMediumDateString(announcement.publishedAt)}</Text>
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
  showSeeAll = true,
}: {
  hero: Announcement;
  others: Announcement[];
  colorPalette: string;
  showSeeAll?: boolean;
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

      {showSeeAll && (
        <Accordion.Item value="see-all" layerStyle="fill.subtle">
          <Accordion.ItemTrigger textStyle="s1" asChild>
            <ChakraLink href="/posts" color="currentColor">
              <Accordion.ItemIndicator transition={undefined}>
                <LuChevronsRight />
              </Accordion.ItemIndicator>
              See all announcements
            </ChakraLink>
          </Accordion.ItemTrigger>
        </Accordion.Item>
      )}
    </Accordion.Root>
  );
}
