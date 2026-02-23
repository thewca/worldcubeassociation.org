import { components } from "@/types/openapi";
import _ from "lodash";
import { Format } from "@/lib/wca/data/formats";
import { orderResults } from "@/lib/live/orderResults";
import { LiveResultsByRegistrationId } from "@/providers/LiveResultProvider";
import { LiveResult } from "@/types/live";

type CompetitorWithResults = components["schemas"]["LiveCompetitor"] & {
  global_pos: number;
  advancing: boolean;
  advancing_questionable: boolean;
  results: LiveResult[];
};

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

  const orderedResults = orderResults(
    Object.values(_.map(orderedResultsByRegistrationId, (r) => r[0])),
    format,
  );

  return orderedResults.map((result) => {
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
