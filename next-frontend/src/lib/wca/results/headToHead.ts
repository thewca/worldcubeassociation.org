import _ from "lodash";
import { components } from "@/types/openapi";

export type H2hRound = components["schemas"]["H2hRound"];
export type H2hMatch = components["schemas"]["H2hMatch"];

export type H2hSet = H2hMatch["sets"][number];
export type H2hAttempt = H2hSet["attempts"][number];

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
 * The winner of a single race, i.e. one `set_attempt_number` solved by
 * every competitor in the match. Null when nobody has a result or on a tie.
 */
export function raceWinnerUserId(attempts: H2hAttempt[]) {
  const valid = attempts.filter((a) => a.value != null && a.value !== 0);
  if (valid.length === 0) return null;

  const sorted = _.toArray(valid).sort((a, b) =>
    compareAttemptValues(a.value!, b.value!),
  );

  const isTied =
    sorted.length > 1 &&
    compareAttemptValues(sorted[0].value!, sorted[1].value!) === 0;

  return isTied ? null : sorted[0].user_id;
}

/**
 * Computes each competitor's races won per set and total sets won.
 * Within a set, every `set_attempt_number` is one race between the
 * competitors; the set goes to whoever wins the most races. The match
 * winner is the competitor with the most sets, or null when undecidable.
 */
export function computeMatchScores(match: H2hMatch): {
  scores: H2hCompetitorScore[];
  winnerUserId: number | null;
} {
  const scores = match.competitors.map((competitor) => ({
    userId: competitor.user_id,
    setWins: 0,
    raceWinsPerSet: [] as number[],
  }));
  const scoresByUserId = _.keyBy(scores, "userId");

  _.sortBy(match.sets, "set_number").forEach((set, setIndex) => {
    scores.forEach((score) => {
      score.raceWinsPerSet[setIndex] = 0;
    });

    const races = _.groupBy(set.attempts, "set_attempt_number");
    Object.values(races).forEach((raceAttempts) => {
      const winnerId = raceWinnerUserId(raceAttempts);
      if (winnerId != null && scoresByUserId[winnerId]) {
        scoresByUserId[winnerId].raceWinsPerSet[setIndex] += 1;
      }
    });

    const bestRaceWins = Math.max(
      ...scores.map((score) => score.raceWinsPerSet[setIndex]),
    );
    const setWinners = scores.filter(
      (score) => score.raceWinsPerSet[setIndex] === bestRaceWins,
    );
    if (bestRaceWins > 0 && setWinners.length === 1) {
      setWinners[0].setWins += 1;
    }
  });

  const bestSetWins = Math.max(...scores.map((score) => score.setWins));
  const matchWinners = scores.filter((score) => score.setWins === bestSetWins);
  const winnerUserId =
    bestSetWins > 0 && matchWinners.length === 1
      ? matchWinners[0].userId
      : null;

  return { scores, winnerUserId };
}

/**
 * The bracket structure is not stored explicitly, so we infer it from the
 * match order: a match belongs to the stage right after the latest stage
 * any of its competitors already played in.
 */
export function groupMatchesIntoStages(matches: H2hMatch[]): H2hMatch[][] {
  const stages: H2hMatch[][] = [];
  const lastStageByUserId = new Map<number, number>();

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

    (stages[stage] ??= []).push(match);
  });

  return stages.filter((stage) => stage !== undefined);
}
