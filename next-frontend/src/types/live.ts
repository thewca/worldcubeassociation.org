import { components } from "@/types/openapi";
import { PartialExcept } from "@/lib/types/objects";

export type LiveResult = components["schemas"]["LiveResult"];
export type LiveRound = components["schemas"]["LiveRound"];
export type PendingLiveResult = PartialExcept<
  LiveResult,
  "registration_id" | "attempts"
>;
