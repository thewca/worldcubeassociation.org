import { components } from "@/types/openapi";
import _ from "lodash";
import { Format } from "@/lib/wca/data/formats";
import { orderResults } from "@/lib/live/orderResults";

export type DualLiveResult = components["schemas"]["LiveResult"] & {
  wcifId: string;
};

export const mergeAndOrderResults = (
  resultsByRegistrationId: Record<string, DualLiveResult[]>,
  competitorsByRegistrationId: Record<
    string,
    components["schemas"]["LiveCompetitor"]
  >,
  format: Format,
) => {
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
      results: orderedResultsByRegistrationId[
        result.registration_id
      ] as DualLiveResult[],
    };
  });
};
