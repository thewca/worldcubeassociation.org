import { Accordion, Link as ChakraLink, Stack, Text } from "@chakra-ui/react";
import AnnouncementContent from "@/components/AnnouncementContent";
import { Announcement, ColorPaletteSelect } from "@/types/payload";
import { LuChevronsRight } from "react-icons/lu";
import { announcementByline } from "@/components/announcements/announcement";
import AnnouncementItemTrigger from "@/components/announcements/AnnouncementItemTrigger";

function AnnouncementItem({
  announcement,
  colorPalette,
}: {
  announcement: Announcement;
  colorPalette: ColorPaletteSelect;
}) {
  return (
    <Accordion.Item
      value={announcement.id}
      borderWidth="1px"
      layerStyle="fill.subtle"
      _open={{ layerStyle: { _light: "fill.solid", _dark: "fill.muted" } }}
    >
      <AnnouncementItemTrigger>
        <Accordion.ItemIndicator _open={{ display: "none" }} />
        <Stack gap={1} alignItems="flex-start">
          <Text textStyle="s1">{announcement.title}</Text>
          <Text>{announcementByline(announcement)}</Text>
        </Stack>
      </AnnouncementItemTrigger>
      <Accordion.ItemContent>
        <AnnouncementContent
          announcement={announcement}
          colorPalette={colorPalette}
        />
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
  colorPalette: ColorPaletteSelect;
  showSeeAll?: boolean;
}) {
  return (
    <Accordion.Root
      variant="card"
      defaultValue={[hero.id]}
      colorPalette={colorPalette}
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
    >
      <AnnouncementItem announcement={hero} colorPalette={colorPalette} />

      {others.map((announcement) => (
        <AnnouncementItem
          key={announcement.id}
          announcement={announcement}
          colorPalette={colorPalette}
        />
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
