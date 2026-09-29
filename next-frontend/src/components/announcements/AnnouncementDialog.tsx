"use client";

import {
  Button,
  Clipboard,
  CloseButton,
  Dialog,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import { LuCheck, LuShare2 } from "react-icons/lu";
import AnnouncementMarkdown from "@/components/announcements/AnnouncementMarkdown";
import {
  announcementByline,
  announcementRoute,
} from "@/components/announcements/announcement";
import { Announcement, ColorPaletteSelect } from "@/types/payload";

/// The announcement's own page is no longer linked from anywhere, so this is
/// how a reader hands the announcement to someone else. It only renders inside
/// the dialog body, which `lazyMount` keeps off the server, so reading
/// `window` here is safe.
function ShareButton({ announcement }: { announcement: Announcement }) {
  const shareUrl = new URL(
    announcementRoute(announcement),
    window.location.origin,
  ).href;

  return (
    <Clipboard.Root value={shareUrl}>
      <Clipboard.Trigger asChild>
        <Button variant="onSolid">
          <Clipboard.Indicator copied={<LuCheck />}>
            <LuShare2 />
          </Clipboard.Indicator>
          <Clipboard.Indicator copied="Link copied">Share</Clipboard.Indicator>
        </Button>
      </Clipboard.Trigger>
    </Clipboard.Root>
  );
}

/// "Read More" opens the full announcement here rather than navigating, so a
/// reader never loses their place in the list. `lazyMount` keeps every
/// announcement's full content out of the list page's HTML.
///
/// The dialog carries the same surface as the card it was opened from, in that
/// card's palette. The portal renders it outside that card, so the palette has
/// to be passed in rather than inherited.
export default function AnnouncementDialog({
  announcement,
  colorPalette,
}: {
  announcement: Announcement;
  colorPalette: ColorPaletteSelect;
}) {
  return (
    <Dialog.Root size="xl" scrollBehavior="inside" lazyMount>
      <Dialog.Trigger asChild>
        <Button variant="onSolid" size="sm" alignSelf="flex-start">
          Read More
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            colorPalette={colorPalette}
            layerStyle={{ _light: "fill.solid", _dark: "fill.muted" }}
          >
            <Dialog.Header>
              <Stack gap={1}>
                <Dialog.Title textStyle="h2">{announcement.title}</Dialog.Title>
                <Text>{announcementByline(announcement)}</Text>
              </Stack>
            </Dialog.Header>
            <Dialog.Body>
              <AnnouncementMarkdown>
                {announcement.contentMarkdown}
              </AnnouncementMarkdown>
            </Dialog.Body>
            <Dialog.Footer>
              <ShareButton announcement={announcement} />
              <Dialog.ActionTrigger asChild>
                <Button variant="onSolid">Close</Button>
              </Dialog.ActionTrigger>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" color="currentColor" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
