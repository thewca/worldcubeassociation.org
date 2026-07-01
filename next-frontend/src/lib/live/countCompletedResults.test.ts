import { describe, expect, it } from "vitest";
import { countCompletedResults } from "@/lib/live/countCompletedResults";
import { LiveResult, LiveRound } from "@/types/live";

const makeResult = (
  registrationId: number,
  attemptValues: number[],
  best: number,
): LiveResult =>
  ({
    registration_id: registrationId,
    best,
    average: 0,
    single_record_tag: "",
    average_record_tag: "",
    advancing: false,
    advancing_questionable: false,
    last_attempt_entered_at: "",
    attempts: attemptValues.map((value, i) => ({
      value,
      attempt_number: i + 1,
    })),
  }) as LiveResult;

const makeRound = (
  format: LiveRound["format"],
  results: LiveResult[],
  cutoff?: LiveRound["cutoff"],
): LiveRound => ({ format, cutoff, results }) as LiveRound;

describe("countCompletedResults", () => {
  it("counts only results with all expected solves", () => {
    // Ao5 => 5 expected solves
    const round = makeRound("a", [
      makeResult(1, [900, 900, 900, 900, 900], 900), // complete
      makeResult(2, [900, 900, 900], 900), // partial
    ]);
    expect(countCompletedResults(round)).toBe(1);
  });

  it("counts a result done at the cutoff that failed to meet it", () => {
    // Ao5 with a 2-attempt cutoff of 1000
    const cutoff = { numberOfAttempts: 2, attemptResult: 1000 };
    const round = makeRound(
      "a",
      [
        makeResult(1, [1500, 1500], 1500), // failed cutoff => entered
        makeResult(2, [500, 500], 500), // met cutoff, not done => not entered
        makeResult(3, [-1, -1], -1), // DNF both => entered
      ],
      cutoff,
    );
    expect(countCompletedResults(round)).toBe(2);
  });
});
