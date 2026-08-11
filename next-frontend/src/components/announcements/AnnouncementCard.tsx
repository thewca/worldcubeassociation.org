import { Card, Link as ChakraLink, Separator } from "@chakra-ui/react";
import Link from "next/link";
import AnnouncementMarkdown from "@/components/announcements/AnnouncementMarkdown";
import {
  announcementByline,
  announcementRoute,
  announcementSummary,
} from "@/components/announcements/announcement";
import ReadMoreButton from "@/components/announcements/ReadMoreButton";
import { Announcement, ColorPaletteSelect } from "@/types/payload";

function AnnouncementHeader({
  announcement,
  linkTitle,
}: {
  announcement: Announcement;
  linkTitle: boolean;
}) {
  return (
    <>
      <Card.Title textStyle="h2" asChild={linkTitle}>
        {linkTitle ? (
          <ChakraLink asChild color="currentColor">
            <Link href={announcementRoute(announcement)}>
              {announcement.title}
            </Link>
          </ChakraLink>
        ) : (
          announcement.title
        )}
      </Card.Title>
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
      layerStyle="card.pastel"
      width="full"
    >
      <Card.Body gap={2}>
        <AnnouncementHeader announcement={announcement} linkTitle />
        <AnnouncementMarkdown>
          {announcementSummary(announcement)}
        </AnnouncementMarkdown>
      </Card.Body>
      <Card.Footer>
        <ReadMoreButton announcement={announcement} />
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
      layerStyle="card.pastel"
      width="full"
    >
      <Card.Body gap={2}>
        <AnnouncementHeader announcement={announcement} linkTitle={false} />

        <AnnouncementMarkdown>
          {announcement.contentMarkdown}
        </AnnouncementMarkdown>
      </Card.Body>
    </Card.Root>
  );
}
