import { Button, Link as ChakraLink } from "@chakra-ui/react";
import { announcementReadMoreHref } from "@/components/announcements/announcement";
import { Announcement } from "@/types/payload";

/// Announcement cards are `fill.subtle`, so the built-in `outline` variant
/// already borders and labels the button in the card's own palette. The link
/// still needs `currentColor`: the `link` recipe pins `colorPalette: "link"`,
/// which would paint the label fixed WCA blue on every card regardless of hue.
export default function ReadMoreButton({
  announcement,
}: {
  announcement: Announcement;
}) {
  return (
    <Button variant="outline" size="sm" alignSelf="flex-start" asChild>
      <ChakraLink
        href={announcementReadMoreHref(announcement)}
        color="currentColor"
      >
        Read More
      </ChakraLink>
    </Button>
  );
}
