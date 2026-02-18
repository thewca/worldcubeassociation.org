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

export function decompressDiff(diff: CompressedLiveResult): LiveResult;
export function decompressDiff(
  diff: DiffedLiveResult,
): PartialLiveResultWithRegistrationId;
export function decompressDiff(
  diff: DiffedLiveResult | CompressedLiveResult,
): PartialLiveResultWithRegistrationId | components["schemas"]["LiveResult"] {
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
        registration_id: diff.r,
        attempts: diff.la?.map((l) => ({ attempt_number: l.an, value: l.v })),
      },
      _.isUndefined,
    ),
  };
}
