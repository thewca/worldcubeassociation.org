import {
  CompressedLiveResult,
  DiffedLiveResult,
} from "@/lib/hooks/useResultsSubscription";
import { LiveResult } from "@/types/live";
import {
  decompressDiff,
  decompressFullResult,
  decompressPartialResult,
} from "@/lib/live/decompressDiff";

export function applyDiffToLiveResults(
  previousResults: LiveResult[],
  updated: DiffedLiveResult[],
  created: CompressedLiveResult[] = [],
  deleted: number[] = [],
): LiveResult[] {
  const deletedSet = new Set(deleted);

  const retainedResults = previousResults.filter(
    (r) => !deletedSet.has(r.registration_id),
  );

  const updatesMap = new Map(
    updated.map((u) => [u.r, decompressDiff(u, decompressPartialResult)]),
  );

  const diffedResults = retainedResults.map((res) => {
    const update = updatesMap.get(res.registration_id) ?? {};
    return { ...res, ...update };
  });

  const createdResults = created.map((c) =>
    decompressDiff(c, decompressFullResult),
  );

  return [...diffedResults, ...createdResults];
}
