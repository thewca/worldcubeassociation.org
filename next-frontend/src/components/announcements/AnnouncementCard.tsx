import { Card, Link as ChakraLink, Separator } from "@chakra-ui/react";
import Link from "next/link";
import { ChakraMarkdown } from "@/components/Markdown";
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
        <ChakraMarkdown paragraphAs={Card.Description} textStyle="body">
          {announcementSummary(announcement)}
        </ChakraMarkdown>
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

        <Card.Title textStyle="h3">Summary</Card.Title>
        <ChakraMarkdown paragraphAs={Card.Description} textStyle="body">
          {announcementSummary(announcement)}
        </ChakraMarkdown>

        <Card.Title textStyle="h3">Body</Card.Title>
        <ChakraMarkdown paragraphAs={Card.Description} textStyle="body">
          {announcement.contentMarkdown}
        </ChakraMarkdown>
      </Card.Body>
    </Card.Root>
  );
}
