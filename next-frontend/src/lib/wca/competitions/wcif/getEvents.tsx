import { serverClient } from "@/lib/wca/wcaAPI";
import { cache } from "react";

export const getEvents = cache(async (competitionId: string) => {
  return await serverClient.GET("/v0/competitions/{competitionId}/events", {
    params: { path: { competitionId } },
  });
});
