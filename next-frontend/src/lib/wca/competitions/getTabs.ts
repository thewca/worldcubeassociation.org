import { cachedServerClient } from "@/lib/wca/wcaAPI";

import { cacheLife } from "next/cache";

export async function getTabs(competitionId: string) {
  "use cache";
  cacheLife("minutes");

  return cachedServerClient.GET("/v0/competitions/{competitionId}/tabs", {
    params: { path: { competitionId } },
  });
}
