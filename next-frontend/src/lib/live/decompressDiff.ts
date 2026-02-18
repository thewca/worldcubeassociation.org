import {
  CompressedLiveResult,
  DiffedLiveResult,
} from "@/lib/hooks/useResultsSubscription";
import { components } from "@/types/openapi";
import _ from "lodash";

type PartialLiveResultWithRegistrationId = Partial<
  components["schemas"]["LiveResult"]
> &
  Pick<components["schemas"]["LiveResult"], "registration_id">;

export function decompressDiff(
  diff: CompressedLiveResult,
): components["schemas"]["LiveResult"];
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
        attempts: diff.la?.map((l) => ({ value: l.v, attempt_number: l.an })),
      },
      _.isUndefined,
    ),
  };
}
