import { ChakraMarkdown } from "@/components/Markdown";

/// Every place an announcement renders prose goes through here, so the homepage
/// accordion and the /posts cards can't drift apart. Announcement text always
/// inherits its card's color: Chakra's `Card.Description` default would
/// otherwise mute it on /posts only.
///
/// Links inherit too, for the same reason: the `link` recipe pins
/// `colorPalette: "link"`, which would paint them fixed WCA blue regardless of
/// the card's own palette. Inheriting costs the colour cue, so underline them
/// instead.
export default function AnnouncementMarkdown({
  children,
}: {
  children?: string | null;
}) {
  return (
    <ChakraMarkdown
      textStyle="body"
      color="currentColor"
      linkProps={{ color: "currentColor", textDecoration: "underline" }}
    >
      {children}
    </ChakraMarkdown>
  );
}
