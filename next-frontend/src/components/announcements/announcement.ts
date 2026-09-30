import _ from "lodash";
import { route } from "nextjs-routes";
import { getFullDateTimeStringNoSeconds } from "@/lib/wca/dates";
import { Announcement, ColorPaletteSelect } from "@/types/payload";

// Matches the `summary` field's limit in the Announcements collection.
const SUMMARY_CHARACTER_LIMIT = 400;

// Announcement cards alternate through the WCA primary colors.
const CARD_COLOR_PALETTES: ColorPaletteSelect[] = [
  "blue",
  "red",
  "green",
  "orange",
  "yellow",
];

/// `index` is the announcement's position in the newest-first list, so the
/// cards on /posts alternate through the palettes instead of clustering.
export const announcementColorPalette = (index: number) =>
  CARD_COLOR_PALETTES[index % CARD_COLOR_PALETTES.length];

/// An announcement's own page is reached by link, not from a card, so there is
/// no neighbouring color to match — pick one at random.
export const randomAnnouncementColorPalette = () =>
  announcementColorPalette(_.random(CARD_COLOR_PALETTES.length - 1));

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
