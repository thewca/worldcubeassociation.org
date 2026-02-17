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
  return _.omitBy(
    {
      ...diff,
      attempts: diff.live_attempts,
    },
    _.isUndefined,
  ) as PartialLiveResultWithRegistrationId;
}
