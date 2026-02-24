import { components } from "@/types/openapi";
import _ from "lodash";
import { Format } from "@/lib/wca/data/formats";
import { orderResults } from "@/lib/live/orderResults";
import { LiveResultsByRegistrationId } from "@/providers/LiveResultProvider";
import { LiveResult, LiveRound } from "@/types/live";

type CompetitorWithResults = components["schemas"]["LiveCompetitor"] &
  Pick<LiveRound, "results"> &
  Pick<LiveResult, "advancing_questionable" | "advancing" | "global_pos">;

export const mergeAndOrderResults = (
  resultsByRegistrationId: LiveResultsByRegistrationId,
  competitorsByRegistrationId: Record<
    string,
    components["schemas"]["LiveCompetitor"]
  >,
  format: Format,
): CompetitorWithResults[] => {
  const orderedResultsByRegistrationId = _.mapValues(
    resultsByRegistrationId,
    (results) => orderResults(results, format),
  );

  const bestResultsPerCompetitor = Object.values(
    orderedResultsByRegistrationId,
  ).map((results) => results[0]);

  const globallyOrderedResults = orderResults(bestResultsPerCompetitor, format);

  return globallyOrderedResults.map((result) => {
    const competitor = competitorsByRegistrationId[result.registration_id];

    return {
      ...competitor,
      global_pos: result.global_pos,
      advancing: result.advancing,
      advancing_questionable: result.advancing_questionable,
      results: orderedResultsByRegistrationId[result.registration_id],
    };
  });
};
