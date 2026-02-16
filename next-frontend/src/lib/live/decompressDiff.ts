import { DiffedLiveResult } from "@/lib/hooks/useResultsSubscription";
import { components } from "@/types/openapi";
import _ from "lodash";

export function decompressDiff(
  diff: DiffedLiveResult,
): Partial<components["schemas"]["LiveResult"]> &
  Pick<components["schemas"]["LiveResult"], "registration_id"> {
  // This looks a little silly right now, but this is part of https://github.com/thewca/worldcubeassociation.org/pull/13352
  // where the actual compressed values will be put in.
  return _.omitBy(
    {
      ...diff,
      attempts: diff.live_attempts,
    },
    _.isUndefined,
  ) as Partial<components["schemas"]["LiveResult"]> &
    Pick<components["schemas"]["LiveResult"], "registration_id">;
}
