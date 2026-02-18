import {
  CompressedLiveResult,
  DiffedLiveResult,
} from "@/lib/hooks/useResultsSubscription";
import { components } from "@/types/openapi";
import _ from "lodash";
import type { PartialExcept } from "@/lib/types/objects";

type LiveResult = components["schemas"]["LiveResult"];

type PartialLiveResultWithRegistrationId = PartialExcept<
  LiveResult,
  "registration_id"
>;

export function decompressFullResult(diff: CompressedLiveResult): LiveResult {
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
  return _.omitBy(
    {
      advancing: diff.ad,
      advancing_questionable: diff.adq,
      average: diff.a,
      best: diff.b,
      average_record_tag: diff.art,
      single_record_tag: diff.srt,
      registration_id: diff.r,
      attempts: diff.la?.map((l) => ({ attempt_number: l.an, value: l.v })),
    },
    _.isUndefined,
  );
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
