import { describe, expect, it } from "vitest";
import { countCompletedResults } from "@/lib/live/countCompletedResults";
import { LiveResult, LiveRound } from "@/types/live";

const makeResult = (partial: Partial<LiveResult>): LiveResult =>
  ({ attempts: [], ...partial }) as LiveResult;

const makeRound = (results: LiveResult[]): LiveRound =>
  ({ results }) as LiveRound;

describe("countCompletedResults", () => {
  it("counts results without forecast statistics as complete", () => {
    const round = makeRound([
      makeResult({
        forecast_statistics: null,
        attempts: [{ value: 900, attempt_number: 1 }],
      }), // complete
      makeResult({
        forecast_statistics: { projected_average: 900 },
        attempts: [{ value: 900, attempt_number: 1 }],
      }), // incomplete
      makeResult({ forecast_statistics: null }), // no attempts => not counted
    ]);

    expect(countCompletedResults(round)).toBe(1);
  });
});
