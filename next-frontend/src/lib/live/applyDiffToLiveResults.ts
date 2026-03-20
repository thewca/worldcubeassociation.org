import { BaseLiveResult, LiveResult } from "@/types/live";
import { DiffedLiveResult } from "@/lib/hooks/useResultsSubscription";

interface ApplyDiffToLiveResultsParams {
  previousResults: LiveResult[];
  updated: DiffedLiveResult[];
  created?: BaseLiveResult[];
  deleted?: number[];
  roundWcifId: string;
}

const augmentResults = (
  r: BaseLiveResult,
  roundWcifId: string,
): LiveResult => ({
  ...r,
  round_wcif_id: roundWcifId,
  // These are calculated dynamically
  global_pos: 0,
  local_pos: 0,
});

export function applyDiffToLiveResults({
  previousResults,
  updated,
  deleted = [],
  created = [],
  roundWcifId,
}: ApplyDiffToLiveResultsParams): LiveResult[] {
  const deletedSet = new Set(deleted);

  const retainedResults = previousResults.filter(
    (r) => !deletedSet.has(r.registration_id),
  );

  const updatesMap = new Map(updated.map((u) => [u.registration_id, u]));

  const diffedResults = retainedResults.map((res) => {
    const update = updatesMap.get(res.registration_id) ?? {};
    return { ...res, ...update };
  });

  return [...diffedResults, ...created].map((r) =>
    augmentResults(r, roundWcifId),
  );
}
