import { components } from "@/types/openapi";
import {
  CompressedLiveResult,
  DiffedLiveResult,
} from "@/lib/hooks/useResultsSubscription";
import { decompressDiff } from "@/lib/live/decompressDiff";

export function applyDiffToLiveResults(
  previousResults: components["schemas"]["LiveResult"][],
  updated: DiffedLiveResult[],
  created: CompressedLiveResult[],
  deleted: number[],
): components["schemas"]["LiveResult"][] {
  const deletedSet = new Set(deleted);
  const updatesMap = new Map(
    updated.map((u) => [u.registration_id, decompressDiff(u)]),
  );

  const diffedResults = previousResults
    .filter((res) => !deletedSet.has(res.registration_id))
    .map((res) => {
      const update = updatesMap.get(res.registration_id);
      return update ? { ...res, ...update } : res;
    });

  return diffedResults.concat(created.map((d) => decompressDiff(d)));
}
