import { Card, Separator } from "@chakra-ui/react";
import AnnouncementMarkdown from "@/components/announcements/AnnouncementMarkdown";
import {
  announcementByline,
  announcementSummary,
} from "@/components/announcements/announcement";
import AnnouncementDialog from "@/components/announcements/AnnouncementDialog";
import { Announcement, ColorPaletteSelect } from "@/types/payload";

function AnnouncementHeader({ announcement }: { announcement: Announcement }) {
  return (
    <>
      <Card.Title textStyle="h2">{announcement.title}</Card.Title>
      <Card.Description color="currentColor">
        {announcementByline(announcement)}
      </Card.Description>
      <Separator size="md" />
    </>
  );
}

export function AnnouncementCard({
  announcement,
  colorPalette,
}: {
  announcement: Announcement;
  colorPalette: ColorPaletteSelect;
}) {
  return (
    <Card.Root
      colorPalette={colorPalette}
      layerStyle={{ _light: "fill.solid", _dark: "fill.muted" }}
      width="full"
    >
      <Card.Body gap={2}>
        <AnnouncementHeader announcement={announcement} />
        <AnnouncementMarkdown>
          {announcementSummary(announcement)}
        </AnnouncementMarkdown>
      </Card.Body>
      <Card.Footer>
        <AnnouncementDialog
          announcement={announcement}
          colorPalette={colorPalette}
        />
      </Card.Footer>
    </Card.Root>
  );
}

export function AnnouncementFullCard({
  announcement,
  colorPalette,
}: {
  announcement: Announcement;
  colorPalette: ColorPaletteSelect;
}) {
  return (
    <Card.Root
      colorPalette={colorPalette}
      layerStyle={{ _light: "fill.solid", _dark: "fill.muted" }}
      width="full"
    >
      <Card.Body gap={2}>
        <AnnouncementHeader announcement={announcement} />

        <AnnouncementMarkdown>
          {announcement.contentMarkdown}
        </AnnouncementMarkdown>
      </Card.Body>
    </Card.Root>
  );
}
