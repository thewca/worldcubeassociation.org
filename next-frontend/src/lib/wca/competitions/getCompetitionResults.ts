import { cachedServerClient } from "@/lib/wca/wcaAPI";

import { cacheLife } from "next/cache";

export async function getCompetitionResults(competitionId: string) {
  "use cache";
  cacheLife("hours");

  return cachedServerClient.GET("/v1/competitions/{competitionId}/results", {
    params: { path: { competitionId } },
  });
}
