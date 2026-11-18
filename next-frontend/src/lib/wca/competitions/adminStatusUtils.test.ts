import { describe, expect, it } from "vitest";
import {
  announcementStatus,
  postingStatus,
} from "@/lib/wca/competitions/adminStatusUtils";
import { components } from "@/types/openapi";

type AdminCompetition = components["schemas"]["AdminCompetitionIndex"];

const makeCompetition = (announcedAt: string | null): AdminCompetition =>
  ({
    start_date: "2026-06-01",
    end_date: "2026-06-02",
    announced_at: announcedAt,
  }) as AdminCompetition;

describe("announcementStatus", () => {
  it.each([
    ["2026-04-01T12:00:00Z", "ok"],
    ["2026-05-08T12:00:00Z", "warning"],
    ["2026-05-20T12:00:00Z", "danger"],
    [null, undefined],
  ])("announced at %s is %s", (announcedAt, expected) => {
    expect(announcementStatus(makeCompetition(announcedAt))).toBe(expected);
  });
});

describe("postingStatus", () => {
  it.each([
    ["2026-06-05T12:00:00Z", "ok"],
    ["2026-06-12T12:00:00Z", "semi_ok"],
    ["2026-06-19T12:00:00Z", "warning"],
    ["2026-06-30T12:00:00Z", "danger"],
    [null, undefined],
  ])("posted at %s is %s", (postedAt, expected) => {
    expect(postingStatus(makeCompetition(null), postedAt)).toBe(expected);
  });
});
