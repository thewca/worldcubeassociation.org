import { ClientOnly } from "@chakra-ui/react";
import LocalDateTime from "@/components/LocalDateTime";
import { Announcement } from "@/types/payload";

/// Phase 2 prefixes this with "Posted by {team name} | ".
export default function AnnouncementByline({
  announcement,
}: {
  announcement: Announcement;
}) {
  // Luxon's ISO parser reads the clock. Defer the date so the announcement can
  // prerender and the browser can format it in the visitor's time zone.
  return (
    <ClientOnly>
      <LocalDateTime isoDateTime={announcement.publishedAt} />
    </ClientOnly>
  );
}
