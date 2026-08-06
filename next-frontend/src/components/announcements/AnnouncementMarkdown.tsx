import { ChakraMarkdown } from "@/components/Markdown";

/// Every place an announcement renders prose goes through here, so the homepage
/// accordion and the /posts cards can't drift apart. Announcement text always
/// inherits its card's color: Chakra's `Card.Description` default would
/// otherwise mute it on /posts only.
///
/// Links inherit too, for the same reason: the `link` recipe pins
/// `colorPalette: "link"`, which would paint them fixed WCA blue on top of a
/// `card.pastel` background drawn from the card's own `1A` — invisible on the
/// blue card. Inheriting costs the colour cue, so underline them instead.
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
