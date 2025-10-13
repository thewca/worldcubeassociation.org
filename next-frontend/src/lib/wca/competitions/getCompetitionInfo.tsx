import { serverClient } from "@/lib/wca/wcaAPI";
import { cache } from "react";

export const getCompetitionInfo = cache(async (competitionId: string) => {
  return await serverClient.GET("/v0/competitions/{competitionId}/", {
    params: { path: { competitionId } },
  });
});
