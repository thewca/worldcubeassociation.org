import _ from "lodash";
import { components } from "@/types/openapi";

export type H2hRound = components["schemas"]["H2hRound"];
export type H2hMatch = components["schemas"]["H2hMatch"];
export type H2hMatchCompetitor = components["schemas"]["H2hMatchCompetitor"];
export type H2hSet = components["schemas"]["H2hSet"];
export type H2hAttempt = components["schemas"]["H2hAttempt"];

// A race the competitor never started, as opposed to a DNF/DNS they did.
const SKIPPED = 0;

export interface H2hCompetitorScore {
  userId: number;
  setWins: number;
  raceWinsPerSet: number[];
}

/**
 * Compares two attempt values the H2H way: any valid time beats DNF/DNS,
 * lower valid times win, and among penalties DNF (-1) beats DNS (-2).
 * Returns a negative number if `a` is better.
 */
export function compareAttemptValues(a: number, b: number) {
  if (a > 0 && b > 0) return a - b;
  if (a > 0) return -1;
  if (b > 0) return 1;
  return b - a;
}

/**
 * Sets in play order. The API does not promise an ordering, and the
 * `raceWinsPerSet` entries of a score line up with this array positionally.
 */
export function orderedSets(match: H2hMatch) {
  return _.sortBy(match.sets, "set_number");
}

/**
 * The winner of a single race, i.e. one `set_attempt_number` solved by
 * every competitor in the match. Null when nobody has a result or on a tie.
 */
export function raceWinnerUserId(attempts: H2hAttempt[]) {
  const attempted = attempts.flatMap((attempt) =>
    attempt.value != null && attempt.value !== SKIPPED
      ? [{ userId: attempt.user_id, value: attempt.value }]
      : [],
  );
  if (attempted.length === 0) return null;

  const [best, runnerUp] = attempted.toSorted((a, b) =>
    compareAttemptValues(a.value, b.value),
  );

  const isTied =
    attempted.length > 1 &&
    compareAttemptValues(best.value, runnerUp.value) === 0;

  return isTied ? null : best.userId;
}

/** Races each competitor took in a set, in `competitors` order. */
function raceWinsPerCompetitor(
  set: H2hSet,
  competitors: H2hMatchCompetitor[],
): number[] {
  const races = Object.values(_.groupBy(set.attempts, "set_attempt_number"));
  const winnerIds = races.map(raceWinnerUserId);

  return competitors.map(
    (competitor) =>
      winnerIds.filter((userId) => userId === competitor.user_id).length,
  );
}

/** Index of the competitor who took the most races, or null when tied or unplayed. */
function setWinnerIndex(raceWins: number[]) {
  const mostWins = Math.max(0, ...raceWins);
  const winnerIndices = raceWins.flatMap((wins, index) =>
    wins === mostWins ? [index] : [],
  );

  return mostWins > 0 && winnerIndices.length === 1 ? winnerIndices[0] : null;
}

/**
 * Computes each competitor's races won per set and total sets won. Within a
 * set, every `set_attempt_number` is one race between the competitors; the set
 * goes to whoever wins the most races. The match winner is the competitor with
 * the most sets, or null when undecidable.
 */
export function computeMatchScores(match: H2hMatch) {
  const raceWinsPerSet = orderedSets(match).map((set) =>
    raceWinsPerCompetitor(set, match.competitors),
  );
  const setWinnerIndices = raceWinsPerSet.map(setWinnerIndex);

  const scores: H2hCompetitorScore[] = match.competitors.map(
    (competitor, competitorIndex) => ({
      userId: competitor.user_id,
      setWins: setWinnerIndices.filter((index) => index === competitorIndex)
        .length,
      raceWinsPerSet: raceWinsPerSet.map(
        (raceWins) => raceWins[competitorIndex],
      ),
    }),
  );

  const mostSetWins = Math.max(0, ...scores.map((score) => score.setWins));
  const winners = scores.filter((score) => score.setWins === mostSetWins);
  const winnerUserId =
    mostSetWins > 0 && winners.length === 1 ? winners[0].userId : null;

  return { scoresByUserId: _.keyBy(scores, "userId"), winnerUserId };
}

/**
 * The bracket structure is not stored explicitly, so we infer it from the
 * match order: a match belongs to the stage right after the latest stage
 * any of its competitors already played in.
 */
export function groupMatchesIntoStages(matches: H2hMatch[]): H2hMatch[][] {
  // Inherently sequential — a match's stage depends on every earlier match — so
  // we carry the latest stage each competitor has played in a mutable lookup.
  const lastStageByUserId = new Map<number, number>();
  const stages: H2hMatch[][] = [];

  _.sortBy(matches, "match_number").forEach((match) => {
    const stage = Math.max(
      0,
      ...match.competitors.map(
        (competitor) => (lastStageByUserId.get(competitor.user_id) ?? -1) + 1,
      ),
    );

    match.competitors.forEach((competitor) =>
      lastStageByUserId.set(competitor.user_id, stage),
    );

    // A stage is only reachable once the stage before it has been played, so
    // `stages` never ends up with holes.
    (stages[stage] ??= []).push(match);
  });

  return stages;
}
