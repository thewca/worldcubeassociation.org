import { serverClient } from "@/lib/wca/wcaAPI";
import { cache } from "react";

export const getCompetitionInfo = cache(async (competitionId: string) => {
  return await serverClient.GET("/competitions/{competitionId}/", {
    params: { path: { competitionId } },
  });
});
