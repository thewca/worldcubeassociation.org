import { components } from "@/types/openapi";
import _ from "lodash";
import { Format } from "@/lib/wca/data/formats";
import { orderResults } from "@/lib/live/orderResults";

export type DualLiveResult = components["schemas"]["LiveResult"] & {
  round_id: string;
};

export const mergeAndOrderResults = (
  resultsByRegistrationId: Record<string, DualLiveResult[]>,
  competitorsByRegistrationId: Record<
    string,
    components["schemas"]["LiveCompetitor"]
  >,
  format: Format,
) => {
  const bestResultByRegistrationId = _.mapValues(
    resultsByRegistrationId,
    (results) => {
      const orderedResults = orderResults(results, format);
      return orderedResults[0];
    },
  );

  const orderedResults = orderResults(
    Object.values(bestResultByRegistrationId),
    format,
  );

  return orderedResults.map((result) => {
    const competitor = competitorsByRegistrationId[result.registration_id];

    return {
      ...competitor,
      results: resultsByRegistrationId[result.registration_id],
    };
  });
};
