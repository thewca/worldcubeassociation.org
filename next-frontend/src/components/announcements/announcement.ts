import _ from "lodash";
import { route } from "nextjs-routes";
import { getFullDateTimeStringNoSeconds } from "@/lib/wca/dates";
import { Announcement } from "@/types/payload";

// Matches the `summary` field's limit in the Announcements collection.
const SUMMARY_CHARACTER_LIMIT = 400;

/// The teaser shown before "Read More". Announcements written before the
/// `summary` field existed fall back to the beginning of their content.
export const announcementSummary = (announcement: Announcement) =>
  announcement.summary ||
  _.truncate(announcement.contentMarkdown ?? "", {
    length: SUMMARY_CHARACTER_LIMIT,
    separator: /\s+/,
    omission: "…",
  });

export const announcementRoute = (announcement: Announcement) =>
  route({
    pathname: "/posts/[announcementId]",
    query: { announcementId: announcement.id },
  });

/// Phase 2 prefixes this with "Posted by {team name} | ".
export const announcementByline = (announcement: Announcement) =>
  getFullDateTimeStringNoSeconds(announcement.publishedAt);

/// Announcements that only exist on the legacy site link out to it; everything
/// else opens the announcement's own page.
export const announcementReadMoreHref = (announcement: Announcement) =>
  announcement.url ?? announcementRoute(announcement);
