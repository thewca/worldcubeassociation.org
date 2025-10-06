import { serverClient } from "@/lib/wca/wcaAPI";
import { cache } from "react";

export const getSchedule = cache(async (competitionId: string) => {
  return await serverClient.GET("/v0/competitions/{competitionId}/schedule", {
    params: { path: { competitionId } },
  });
});
