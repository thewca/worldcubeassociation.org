import { components } from "@/types/openapi";

/**
 * One result together with the context of the round it was earned in. The competition results
 * endpoint nests results inside their round, so views that list results on their own — by person,
 * say — have to carry that context down to each row.
 */
export type CompetitionResultRow = components["schemas"]["V1RoundResult"] & {
  event_id: string;
  round_type_id: string;
  ranking: components["schemas"]["Ranking"];
};

export function roundResultRows(
  rounds: components["schemas"]["V1CompetitionRound"][],
): CompetitionResultRow[] {
  return rounds.flatMap((round) =>
    round.results.map((result) => ({
      ...result,
      event_id: round.event_id,
      round_type_id: round.round_type_id,
      ranking: round.ranking,
    })),
  );
}
