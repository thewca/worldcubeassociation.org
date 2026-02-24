import {
  CompressedLiveResult,
  DiffedLiveResult,
} from "@/lib/hooks/useResultsSubscription";
import _ from "lodash";
import { LiveResult } from "@/types/live";
import { PartialExcept } from "@/lib/types/objects";

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
): PartialLiveResultWithRegistrationId | LiveResult {
  return {
    registration_id: diff.registration_id,
    ..._.omitBy(
      {
        ...diff,
        attempts: diff.live_attempts,
      },
      _.isUndefined,
    ),
  };
}
