import { Button, Link as ChakraLink } from "@chakra-ui/react";
import { announcementReadMoreHref } from "@/components/announcements/announcement";
import { Announcement } from "@/types/payload";

/// Announcement cards are `card.pastel`, so their background is the card's own
/// `1A` and the palette varies per card. `pastelSolid` is locked to blue and
/// paints `blue.1A`, which is exactly the blue card's background — so the
/// button vanishes into it. Border and label follow the card's contrast colour
/// instead, which works on every palette. The hover veil has to come from
/// `pastelContrast` rather than the built-in `outline` variant's
/// `colorPalette.subtle`: a pale tint of the card's own hue would leave the
/// `currentColor` label unreadable.
export default function ReadMoreButton({
  announcement,
}: {
  announcement: Announcement;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      alignSelf="flex-start"
      asChild
      color="currentColor"
      borderColor="currentColor"
      _hover={{ bg: "colorPalette.pastelContrast/15" }}
    >
      <ChakraLink
        href={announcementReadMoreHref(announcement)}
        color="currentColor"
      >
        Read More
      </ChakraLink>
    </Button>
  );
}
