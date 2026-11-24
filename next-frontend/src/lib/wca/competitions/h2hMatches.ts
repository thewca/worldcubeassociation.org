import _ from "lodash";
import { isSkipped, maxAttemptCount } from "@/lib/wca/results/attempts";
import {
  computeMatchScores,
  H2hAttempt,
  H2hMatch,
  H2hMatchCompetitor,
  H2hSet,
  orderedSets,
  raceWinnerUserId,
} from "@/lib/wca/results/headToHead";
import { ByCompetitionResultsRow } from "@/lib/wca/results/competitionResults";

export type Outcome = "win" | "loss" | "tie";

export type AnalysedRace = {
  attemptNumber: number;
  own?: number;
  opponent?: number;
  outcome: Outcome;
};

export type AnalysedSet = {
  setNumber: number;
  races: AnalysedRace[];
  ownPoints: number;
  opponentPoints: number;
  outcome: Outcome;
  best?: number;
};

export type MatchStage =
  | { type: "final" | "third_place" | "semifinal" | "quarterfinal" }
  | { type: "stage_of"; places: number };

export type AnalysedMatch = {
  matchNumber: number;
  stage?: MatchStage;
  opponent: H2hMatchCompetitor;
  sets: AnalysedSet[];
  ownSets: number;
  opponentSets: number;
  outcome: Outcome;
};

function outcomeFor(ownId: number, winnerUserId: number | null): Outcome {
  if (winnerUserId === null) return "tie";
  return winnerUserId === ownId ? "win" : "loss";
}

function compareScores(own: number, opponent: number): Outcome {
  if (own === opponent) return "tie";
  return own > opponent ? "win" : "loss";
}

function attemptValue(attempts: H2hAttempt[], userId: number) {
  const value = attempts.find((attempt) => attempt.user_id === userId)?.value;

  return value == null || isSkipped(value) ? undefined : value;
}

function analyseRaces(
  set: H2hSet,
  ownId: number,
  opponentId: number,
): AnalysedRace[] {
  const attemptsByNumber = _.groupBy(set.attempts, "set_attempt_number");
  const attemptNumbers = _.sortBy(Object.keys(attemptsByNumber).map(Number));

  return attemptNumbers.map((attemptNumber) => {
    const attempts = attemptsByNumber[attemptNumber];

    return {
      attemptNumber,
      own: attemptValue(attempts, ownId),
      opponent: attemptValue(attempts, opponentId),
      outcome: outcomeFor(ownId, raceWinnerUserId(attempts)),
    };
  });
}

// A match's loser finishes below everyone still in the bracket, so the worse of the two final
// positions gives the stage without needing the rest of the bracket, which this payload lacks.
// Unknown as soon as either position is, for example after an opponent was anonymized.
function matchStage(match: H2hMatch): MatchStage | undefined {
  const positions = match.competitors.flatMap(
    (competitor) => competitor.final_pos ?? [],
  );
  if (positions.length < match.competitors.length) return undefined;

  const winnerPos = Math.min(...positions);
  const loserPos = Math.max(...positions);

  if (loserPos <= 2) return { type: "final" };
  // Semifinal winners always reach the top two, so 3rd against 4th is its own match.
  if (winnerPos === 3 && loserPos === 4) return { type: "third_place" };
  if (loserPos <= 4) return { type: "semifinal" };
  if (loserPos <= 8) return { type: "quarterfinal" };

  return { type: "stage_of", places: 2 ** Math.ceil(Math.log2(loserPos)) };
}

function analyseMatch(wcaId: string, match: H2hMatch): AnalysedMatch[] {
  const own = match.competitors.find((c) => c.wca_id === wcaId);
  const opponent = match.competitors.find((c) => c.wca_id !== wcaId);
  if (!own || !opponent) return [];

  const { scoresByUserId, winnerUserId } = computeMatchScores(match);
  const ownScore = scoresByUserId[own.user_id];
  const opponentScore = scoresByUserId[opponent.user_id];

  const sets = orderedSets(match).map((set, setIndex) => {
    const races = analyseRaces(set, own.user_id, opponent.user_id);
    const ownPoints = ownScore.raceWinsPerSet[setIndex];
    const opponentPoints = opponentScore.raceWinsPerSet[setIndex];

    return {
      setNumber: set.set_number,
      races,
      ownPoints,
      opponentPoints,
      outcome: compareScores(ownPoints, opponentPoints),
      best: _.min(
        races.flatMap(({ own }) => (own !== undefined && own > 0 ? own : [])),
      ),
    };
  });

  return [
    {
      matchNumber: match.match_number,
      stage: matchStage(match),
      opponent,
      sets,
      ownSets: ownScore.setWins,
      opponentSets: opponentScore.setWins,
      outcome: outcomeFor(own.user_id, winnerUserId),
    },
  ];
}

export function analyseMatches(
  result: Pick<ByCompetitionResultsRow, "wca_id" | "participated_matches">,
): AnalysedMatch[] {
  return _.orderBy(result.participated_matches, "match_number", "desc").flatMap(
    (match) => analyseMatch(result.wca_id, match),
  );
}

// A head-to-head result's own `attempts` lists every solve of every match, so only the attempt
// numbers within its sets count: each set is laid out on its own row.
export function attemptColumnCount(
  results: Pick<
    ByCompetitionResultsRow,
    "ranking_mode" | "attempts" | "participated_matches"
  >[],
) {
  const [headToHead, classic] = _.partition(
    results,
    (result) => result.ranking_mode === "head_to_head",
  );

  const setAttemptNumbers = headToHead.flatMap((result) =>
    (result.participated_matches ?? []).flatMap((match) =>
      match.sets.flatMap((set) =>
        set.attempts.map((attempt) => attempt.set_attempt_number),
      ),
    ),
  );

  // An H2H-only table without matches still needs a column under its "Solves" heading.
  return Math.max(1, maxAttemptCount(classic), ...setAttemptNumbers);
}
