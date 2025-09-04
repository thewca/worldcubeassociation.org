import { serverClient } from "@/lib/wca/wcaAPI";

import { cache } from "react";

export const getScrambles = cache(async (competitionId: string) => {
  return await serverClient.GET("/competitions/{competitionId}/scrambles", {
    params: { path: { competitionId } },
  });
});
