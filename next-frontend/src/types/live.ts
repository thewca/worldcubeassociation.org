import { components } from "@/types/openapi";
import { PartialExcept } from "@/lib/types/objects";
import {CompressedLiveResult} from "@/lib/hooks/useResultsSubscription";

export type LiveResult = components["schemas"]["RoundLiveResult"] | components["schemas"]["ByPersonLiveResult"];
export type LiveRound = components["schemas"]["LiveRound"];
export type PendingLiveResult = PartialExcept<
  CompressedLiveResult,
  "registration_id" | "live_attempts"
>;
