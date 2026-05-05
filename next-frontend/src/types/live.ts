import { components } from "@/types/openapi";
import { PartialExcept } from "@/lib/types/objects";

export type LiveResult = components["schemas"]["RoundLiveResult"] | components["schemas"]["ByPersonLiveResult"];
export type BaseLiveResult = components["schemas"]["BaseLiveResult"];
export type LiveCompetitor = components["schemas"]["LiveCompetitor"];
export type LiveAttempt = components["schemas"]["LiveAttempt"];
export type LiveRound = components["schemas"]["LiveRound"];
export type LiveRoundState = components["schemas"]["LiveRoundAdmin"]["state"];
export type LiveRoundAdmin = components["schemas"]["LiveRoundAdmin"]
export type LiveRoundAdminBase = components["schemas"]["BaseAdminRound"]
export type PendingLiveResult = PartialExcept<
  LiveResult,
  "registration_id" | "attempts"
>;
