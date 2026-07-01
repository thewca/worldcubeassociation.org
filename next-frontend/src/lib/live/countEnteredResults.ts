import formats from "@/lib/wca/data/formats";
import { LiveResult, LiveRound } from "@/types/live";
import { components } from "@/types/openapi";

type WcifCutoff = components["schemas"]["WcifCutoff"];

// Mirrors Round#competitors_live_results_entered on the backend: a competitor
// counts as "entered" once their result is complete, i.e. all expected solves
// are in, or they've done the cutoff attempts without meeting the cutoff.
const isComplete = (
  result: LiveResult,
  expectedSolveCount: number,
  cutoff: WcifCutoff | undefined,
) => {
  const attemptsCount = result.attempts.length;

  if (attemptsCount === expectedSolveCount) return true;

  if (cutoff && attemptsCount === cutoff.numberOfAttempts) {
    // Didn't meet the cutoff (best is worse-or-equal, or DNF/DNS < 0).
    return result.best >= cutoff.attemptResult || result.best < 0;
  }

  return false;
};

export const countEnteredResults = (round: LiveRound) => {
  const expectedSolveCount = formats.byId[round.format].expected_solve_count;

  return round.results.filter((r) =>
    isComplete(r, expectedSolveCount, round.cutoff),
  ).length;
};
