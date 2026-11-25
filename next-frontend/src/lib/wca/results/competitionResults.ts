import { components } from "@/types/openapi";

/**
 * A person's result grouped under its competition. The records endpoint returns plain `V1Result`s,
 * so everything only the results endpoint carries is optional.
 */
export type ByCompetitionResultsRow = components["schemas"]["V1Result"] &
  Partial<
    Pick<
      components["schemas"]["V1PersonResult"],
      | "participated_matches"
      | "is_personal_best_single"
      | "is_personal_best_average"
    >
  >;

/**
 * One result together with the context of the round it was earned in. The competition results
 * endpoint nests results inside their round, so views that list results on their own — by person,
 * say — have to carry that context down to each row.
 */
export type ByPersonResultsRow = components["schemas"]["V1RoundResult"] & {
  event_id: string;
  round_type_id: string;
  rankingMode: components["schemas"]["RankingMode"];
};

export function roundResultRows(
  rounds: components["schemas"]["V1CompetitionRound"][],
): ByPersonResultsRow[] {
  return rounds.flatMap((round) =>
    round.results.map((result) => ({
      ...result,
      event_id: round.event_id,
      round_type_id: round.round_type_id,
      rankingMode: round.ranking_mode,
    })),
  );
}
