import { serverClient } from "@/lib/wca/wcaAPI";

import { cache } from "react";

export const getScrambles = cache(async (competitionId: string) => {
  return await serverClient.GET("/v0/competitions/{competitionId}/scrambles", {
    params: { path: { competitionId } },
  });
});
