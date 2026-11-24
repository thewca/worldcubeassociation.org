import _ from "lodash";
import { components } from "@/types/openapi";
import { maxAttemptCount } from "@/lib/wca/results/attempts";

type V1Result = components["schemas"]["V1Result"];
type V1PersonResult = components["schemas"]["V1PersonResult"];
type H2hMatch = components["schemas"]["H2hMatch"];
type H2hSet = components["schemas"]["H2hSet"];

// ---------------------------------------------------------------------------
// Outcomes
// ---------------------------------------------------------------------------
export type Outcome = "win" | "loss" | "tie";

const isSolved = (value: number) => value > 0;

// Whoever is faster scores the point. A DNF only loses to a time.
export function solveOutcome(own: number, opponent: number): Outcome {
  if (isSolved(own) !== isSolved(opponent))
    return isSolved(own) ? "win" : "loss";
  if (!isSolved(own) || own === opponent) return "tie";
  return own < opponent ? "win" : "loss";
}

// For counts of points or sets, where more is better.
const compareScores = (own: number, opponent: number): Outcome =>
  own > opponent ? "win" : own < opponent ? "loss" : "tie";

// ---------------------------------------------------------------------------
// Analysis: raw payload -> what the table rows need
// ---------------------------------------------------------------------------
export type AttemptPair = { own?: number; opponent?: number };

export type AnalysedSet = {
  setNumber: number;
  pairs: AttemptPair[];
  ownPoints: number;
  opponentPoints: number;
  outcome: Outcome;
  best?: number;
};

export type AnalysedMatch = {
  matchNumber: number;
  // How many competitors were left when the match was played: 2 for the final,
  // 4 for a semifinal, 8 for a quarterfinal, 16 for the stage of 16... Null while
  // final positions are unknown.
  stagePlaces: number | null;
  opponent: H2hMatch["competitors"][number];
  sets: AnalysedSet[];
  ownSets: number;
  opponentSets: number;
  outcome: Outcome;
};

function analyseSet(
  set: H2hSet,
  ownId: number,
  opponentId: number,
): AnalysedSet {
  // Attempt number -> time, leaving out attempts that were never recorded.
  const valuesOf = (userId: number) =>
    new Map<number, number>(
      set.attempts.flatMap((attempt) =>
        attempt.user_id === userId && attempt.value !== null
          ? [[attempt.set_attempt_number, attempt.value] as [number, number]]
          : [],
      ),
    );
  const ownValues = valuesOf(ownId);
  const opponentValues = valuesOf(opponentId);

  const attemptNumbers = set.attempts.map((a) => a.set_attempt_number);
  const pairs = _.range(1, (_.max(attemptNumbers) ?? 0) + 1).map((number) => ({
    own: ownValues.get(number),
    opponent: opponentValues.get(number),
  }));

  const points = _.countBy(
    pairs.map(({ own, opponent }) =>
      own === undefined || opponent === undefined
        ? undefined
        : solveOutcome(own, opponent),
    ),
  );
  const ownPoints = points.win ?? 0;
  const opponentPoints = points.loss ?? 0;

  return {
    setNumber: set.set_number,
    pairs,
    ownPoints,
    opponentPoints,
    outcome: compareScores(ownPoints, opponentPoints),
    best: _.min(
      pairs.flatMap(({ own }) =>
        own !== undefined && isSolved(own) ? [own] : [],
      ),
    ),
  };
}

// The loser of a match is eliminated at that stage, so they finish below everyone
// who is still in: the stage with `places` competitors left eliminates the
// positions places/2 + 1 .. places. The worse of the two final positions is the
// loser's, which gives the stage without needing the size or numbering of the
// bracket (byes included).
function stagePlacesOf(match: H2hMatch) {
  const loserPosition = _.max(
    match.competitors.flatMap((c) =>
      c.final_pos === null ? [] : [c.final_pos],
    ),
  );
  if (loserPosition === undefined) return null;

  return Math.max(2, 2 ** Math.ceil(Math.log2(loserPosition)));
}

// The result belongs to the person whose page this is, who is one of the two
// competitors of every match.
function analyseMatch(
  result: V1PersonResult,
  match: H2hMatch,
): AnalysedMatch | null {
  const own = match.competitors.find((c) => c.wca_id === result.wca_id);
  const opponent = match.competitors.find((c) => c !== own);
  if (!own || !opponent) return null;

  const sets = _.sortBy(match.sets, "set_number").map((set) =>
    analyseSet(set, own.user_id, opponent.user_id),
  );
  const ownSets = sets.filter((s) => s.outcome === "win").length;
  const opponentSets = sets.filter((s) => s.outcome === "loss").length;

  return {
    matchNumber: match.match_number,
    stagePlaces: stagePlacesOf(match),
    opponent,
    sets,
    ownSets,
    opponentSets,
    outcome: compareScores(ownSets, opponentSets),
  };
}

// The person's matches, latest first like the rest of the page.
export function analyseMatches(result: V1PersonResult): AnalysedMatch[] {
  return _.orderBy(result.participated_matches, "match_number", "desc").flatMap(
    (match) => analyseMatch(result, match) ?? [],
  );
}

// ---------------------------------------------------------------------------
// Bracket and table layout
// ---------------------------------------------------------------------------

export const isHeadToHead = (result: V1Result) =>
  result.ranking_mode === "head_to_head";

// A set is first to 3 points, so it has at most 5 attempts.
const H2H_MAX_ATTEMPTS_PER_SET = 5;

// Number of solve columns a table of these results needs. A head-to-head result's
// own `attempts` lists every solve of every match, so it must not count towards
// the width of the table: its sets are laid out one row at a time instead.
export function attemptColumnCount(results: V1Result[]) {
  const [headToHead, classic] = _.partition(results, isHeadToHead);

  return Math.max(
    classic.length > 0 ? maxAttemptCount(classic) : 0,
    headToHead.length > 0 ? H2H_MAX_ATTEMPTS_PER_SET : 0,
  );
}
