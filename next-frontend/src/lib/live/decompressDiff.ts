import {
  CompressedLiveResult,
  DiffedLiveResult,
} from "@/lib/hooks/useResultsSubscription";
import _ from "lodash";
import type { PartialExcept } from "@/lib/types/objects";
import { BaseLiveResult, LiveResult } from "@/types/live";

type PartialLiveResultWithRegistrationId = PartialExcept<
  LiveResult,
  "registration_id"
>;

export function decompressFullResult(
  diff: CompressedLiveResult,
): BaseLiveResult {
  return {
    advancing: diff.ad,
    advancing_questionable: diff.adq,
    average: diff.a,
    best: diff.b,
    average_record_tag: diff.art,
    single_record_tag: diff.srt,
    registration_id: diff.r,
    attempts: diff.la.map((l) => ({ attempt_number: l.an, value: l.v })),
  };
}

export function decompressPartialResult(
  diff: DiffedLiveResult,
): PartialLiveResultWithRegistrationId {
  return {
    registration_id: diff.r,
    ..._.omitBy(
      {
        advancing: diff.ad,
        advancing_questionable: diff.adq,
        average: diff.a,
        best: diff.b,
        average_record_tag: diff.art,
        single_record_tag: diff.srt,
        attempts: diff.la?.map((l) => ({ attempt_number: l.an, value: l.v })),
      },
      _.isUndefined,
    ),
  };
}

export function decompressDiff<
  T extends Pick<CompressedLiveResult, "r">,
  U extends Pick<LiveResult, "registration_id">,
>(compressed: T, decompressionRoutine: (comp: T) => U): U {
  return {
    ...decompressionRoutine(compressed),
    registration_id: compressed.r,
  };
}
