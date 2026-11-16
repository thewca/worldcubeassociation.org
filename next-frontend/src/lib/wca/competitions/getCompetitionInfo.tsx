import { serverClient } from "@/lib/wca/wcaAPI";

import { cacheLife } from "next/cache";

export async function getCompetitionInfo(competitionId: string) {
  "use cache";
  cacheLife("minutes");

  return serverClient.GET("/v0/competitions/{competitionId}/", {
    params: { path: { competitionId } },
  });
}
