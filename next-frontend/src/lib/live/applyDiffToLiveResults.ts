import {
  CompressedLiveResult,
  DiffedLiveResult,
} from "@/lib/hooks/useResultsSubscription";
import { BaseLiveResult, LiveResult } from "@/types/live";
import {
  decompressDiff,
  decompressFullResult,
  decompressPartialResult,
} from "@/lib/live/decompressDiff";
import { parseActivityCode } from "@/lib/wca/wcif/rounds";

const augmentResults = (
  r: BaseLiveResult,
  roundWcifId: string,
  eventId: string,
): LiveResult => ({
  ...r,
  round_wcif_id: roundWcifId,
  event_id: eventId,
  // These are calculated dynamically
  global_pos: 0,
  local_pos: 0,
});

interface ApplyDiffToLiveResultsParams {
  previousResults: LiveResult[];
  updated: DiffedLiveResult[];
  created?: CompressedLiveResult[];
  deleted?: number[];
  roundWcifId: string;
}

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

  const { eventId } = parseActivityCode(roundWcifId);

  return [...diffedResults, ...createdResults].map((r) =>
    augmentResults(r, roundWcifId, eventId),
  );
}
