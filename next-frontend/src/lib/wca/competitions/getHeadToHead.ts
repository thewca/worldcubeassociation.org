import { serverClient } from "@/lib/wca/wcaAPI";
import { cache } from "react";

export const getHeadToHead = cache(async (competitionId: string) => {
  return await serverClient.GET(
    "/v1/competitions/{competitionId}/head-to-head",
    {
      params: { path: { competitionId } },
    },
  );
});
