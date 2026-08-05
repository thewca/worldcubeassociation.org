import { ChakraMarkdown } from "@/components/Markdown";

/// Every place an announcement renders prose goes through here, so the homepage
/// accordion and the /posts cards can't drift apart. Announcement text always
/// inherits its card's color: Chakra's `Card.Description` default would
/// otherwise mute it on /posts only.
export default function AnnouncementMarkdown({
  children,
}: {
  children?: string | null;
}) {
  return (
    <ChakraMarkdown textStyle="body" color="currentColor">
      {children}
    </ChakraMarkdown>
  );
}
