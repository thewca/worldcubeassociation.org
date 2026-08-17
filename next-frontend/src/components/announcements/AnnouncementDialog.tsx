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
import { Announcement } from "@/types/payload";

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
        <Button variant="outline">
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
export default function AnnouncementDialog({
  announcement,
}: {
  announcement: Announcement;
}) {
  return (
    <Dialog.Root size="xl" scrollBehavior="inside" lazyMount>
      {/*
        Announcement cards are `card.pastel`, so their background is the card's
        own `1A` and the palette varies per card. `pastelSolid` is locked to
        blue and paints `blue.1A`, which is exactly the blue card's background —
        so the button vanishes into it. Border and label follow the card's
        contrast colour instead, which works on every palette. The hover veil
        has to come from `pastelContrast` rather than the built-in `outline`
        variant's `colorPalette.subtle`: a pale tint of the card's own hue would
        leave the `currentColor` label unreadable.
      */}
      <Dialog.Trigger asChild>
        <Button
          variant="outline"
          size="sm"
          alignSelf="flex-start"
          color="currentColor"
          borderColor="currentColor"
          _hover={{ bg: "colorPalette.pastelContrast/15" }}
        >
          Read More
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
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
                <Button variant="outline">Close</Button>
              </Dialog.ActionTrigger>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
