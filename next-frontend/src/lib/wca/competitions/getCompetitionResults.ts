import { serverClient } from "@/lib/wca/wcaAPI";

import { cacheLife } from "next/cache";

export async function getCompetitionResults(competitionId: string) {
  "use cache";
  cacheLife("hours");

  return serverClient.GET("/v1/competitions/{competitionId}/results", {
    params: { path: { competitionId } },
  });
}
