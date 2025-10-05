import { serverClient } from "@/lib/wca/wcaAPI";
import { cache } from "react";

export const getPodiums = cache(async (competitionId: string) => {
  return await serverClient.GET("/v0/competitions/{competitionId}/podiums", {
    params: { path: { competitionId } },
  });
});
