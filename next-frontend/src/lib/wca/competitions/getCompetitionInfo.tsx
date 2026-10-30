import { cachedServerClient } from "@/lib/wca/wcaAPI";

import { cacheLife } from "next/cache";

export async function getCompetitionInfo(competitionId: string) {
  "use cache";
  cacheLife("minutes");

  return cachedServerClient.GET("/v0/competitions/{competitionId}/", {
    params: { path: { competitionId } },
  });
}
