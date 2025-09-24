import { serverClient } from "@/lib/wca/wcaAPI";
import { cache } from "react";

export const getCompetitionResults = cache(async (competitionId: string) => {
  return await serverClient.GET("/v0/competitions/{competitionId}/results", {
    params: { path: { competitionId } },
  });
});
