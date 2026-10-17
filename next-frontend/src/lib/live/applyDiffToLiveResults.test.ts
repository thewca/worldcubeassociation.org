import { describe, expect, it } from "vitest";
import { applyDiffToLiveResults } from "@/lib/live/applyDiffToLiveResults";
import { components } from "@/types/openapi";

type RoundLiveResult = components["schemas"]["RoundLiveResult"];

const previousResults = [
  {
    registration_id: 1,
    attempts: [{ value: 900, attempt_number: 1 }],
    forecast_statistics: { projected_average: 900 },
  },
] as RoundLiveResult[];

describe("applyDiffToLiveResults", () => {
  it("clears stale forecast stats when attempts arrive without them", () => {
    const [result] = applyDiffToLiveResults({
      previousResults,
      updated: [
        {
          registration_id: 1,
          attempts: [
            { value: 900, attempt_number: 1 },
            { value: 900, attempt_number: 2 },
            { value: 900, attempt_number: 3 },
          ],
        },
      ],
      roundWcifId: "333-r1",
    }) as RoundLiveResult[];

    expect(result.forecast_statistics).toBeNull();
  });

  it("keeps existing forecast stats when the update has no attempts", () => {
    const [result] = applyDiffToLiveResults({
      previousResults,
      updated: [{ registration_id: 1, advancing: true }],
      roundWcifId: "333-r1",
    }) as RoundLiveResult[];

    expect(result.forecast_statistics).toEqual({ projected_average: 900 });
  });
});
