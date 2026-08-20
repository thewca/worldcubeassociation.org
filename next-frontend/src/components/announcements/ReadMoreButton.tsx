import { Button, Link as ChakraLink } from "@chakra-ui/react";
import { announcementReadMoreHref } from "@/components/announcements/announcement";
import { Announcement } from "@/types/payload";

/// Announcement cards are `fill.solid` in light mode, where the built-in
/// `outline` variant would tint itself from the card's own hue and vanish into
/// the background — hence `onSolid`, which inherits the surface's foreground.
/// The link needs `currentColor` for a separate reason: the `link` recipe pins
/// `colorPalette: "link"`, which would paint the label fixed WCA blue on every
/// card regardless of hue.
export default function ReadMoreButton({
  announcement,
}: {
  announcement: Announcement;
}) {
  return (
    <Button variant="onSolid" size="sm" alignSelf="flex-start" asChild>
      <ChakraLink
        href={announcementReadMoreHref(announcement)}
        color="currentColor"
      >
        Read More
      </ChakraLink>
    </Button>
  );
}
