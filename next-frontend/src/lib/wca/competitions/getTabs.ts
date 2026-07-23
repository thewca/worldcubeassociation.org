import { serverClient } from "@/lib/wca/wcaAPI";

import { cache } from "react";

export const getTabs = cache(async (competitionId: string) => {
  return await serverClient.GET("/v0/competitions/{competitionId}/tabs", {
    params: { path: { competitionId } },
  });
});
