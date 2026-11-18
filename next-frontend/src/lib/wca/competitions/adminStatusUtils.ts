import { DateTime } from "luxon";
import { components } from "@/types/openapi";

type AdminCompetition = components["schemas"]["AdminCompetitionIndex"];

export type AdminStatus = "ok" | "semi_ok" | "warning" | "danger";

// Ported from the legacy competition-table.js: announcing fewer than this many days before the
// start is flagged, and so is posting the report or results more than this many days after the end.
const ANNOUNCEMENT_DAYS_WARNING = 28;
const ANNOUNCEMENT_DAYS_DANGER = 21;
const POSTING_DAYS_SEMI_OK = 7;
const POSTING_DAYS_WARNING = 14;
const POSTING_DAYS_DANGER = 21;

const startOfStartDate = (competition: AdminCompetition) =>
  DateTime.fromISO(competition.start_date, { zone: "utc" }).startOf("day");

const startOfEndDate = (competition: AdminCompetition) =>
  DateTime.fromISO(competition.end_date, { zone: "utc" }).startOf("day");

export const daysBeforeStart = (
  competition: AdminCompetition,
  dateTime: string,
) =>
  Math.ceil(
    Math.abs(
      startOfStartDate(competition).diff(DateTime.fromISO(dateTime), "days")
        .days,
    ),
  );

export const daysAfterEnd = (competition: AdminCompetition, dateTime: string) =>
  DateTime.fromISO(dateTime, { zone: "utc" })
    .startOf("day")
    .diff(startOfEndDate(competition), "days").days;

export const announcementStatus = (
  competition: AdminCompetition,
): AdminStatus | undefined => {
  if (!competition.announced_at) return undefined;

  const days = daysBeforeStart(competition, competition.announced_at);

  if (days < ANNOUNCEMENT_DAYS_DANGER) return "danger";
  if (days < ANNOUNCEMENT_DAYS_WARNING) return "warning";
  return "ok";
};

export const postingStatus = (
  competition: AdminCompetition,
  postedAt: string | null,
): AdminStatus | undefined => {
  if (!postedAt) return undefined;

  const days = daysAfterEnd(competition, postedAt);

  if (days > POSTING_DAYS_DANGER) return "danger";
  if (days > POSTING_DAYS_WARNING) return "warning";
  if (days > POSTING_DAYS_SEMI_OK) return "semi_ok";
  return "ok";
};
