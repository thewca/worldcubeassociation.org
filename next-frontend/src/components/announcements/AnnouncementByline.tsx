import LocalDateTime from "@/components/LocalDateTime";
import { Announcement } from "@/types/payload";

/// Phase 2 prefixes this with "Posted by {team name} | ".
export default function AnnouncementByline({
  announcement,
}: {
  announcement: Announcement;
}) {
  return <LocalDateTime isoDateTime={announcement.publishedAt} />;
}
