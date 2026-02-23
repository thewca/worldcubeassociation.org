import { DualLiveResult } from "@/lib/live/mergeAndOrderResults";
import { DiffedLiveResult } from "@/lib/hooks/useResultsSubscription";
import _ from "lodash";

export function applyDiffToDualRoundResults(
  previousResults: Record<string, DualLiveResult[]>,
  updated: DiffedLiveResult[],
  created: DualLiveResult[],
  deleted: number[],
  wcif_id: string,
): Record<string, DualLiveResult[]> {
  const deletedSet = new Set(deleted);
  const updatesMap = new Map(updated.map((u) => [u.registration_id, u]));

  const resultsWithoutRemoved = _.filter(
    previousResults,
    (_r, registration_id) => !deletedSet.has(Number(registration_id)),
  );

  const updatedResults = _.mapValues(resultsWithoutRemoved, (results) => {
    return results.map((result) => {
      const update = updatesMap.get(result.registration_id);
      return update && wcif_id === result.wcifId
        ? { ...result, ...update }
        : result;
    });
  });

  const newResults = _.groupBy(created, "registration_id");

  return _.merge(updatedResults, newResults);
}
