import { components } from "@/types/openapi";
import { PartialExcept } from "@/lib/types/objects";

export type LiveResult = components["schemas"]["RoundLiveResult"] | components["schemas"]["ByPersonLiveResult"];
export type BaseLiveResult = components["schemas"]["BaseLiveResult"];
export type LiveCompetitor = components["schemas"]["LiveCompetitor"];
export type LiveRound = components["schemas"]["LiveRound"];
export type PendingLiveResult = PartialExcept<
  LiveResult,
  "registration_id" | "attempts"
>;
