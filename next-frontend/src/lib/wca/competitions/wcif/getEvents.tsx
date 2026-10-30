import { cachedServerClient } from "@/lib/wca/wcaAPI";

import { cacheLife } from "next/cache";

export async function getEvents(competitionId: string) {
  "use cache";
  cacheLife("minutes");

  return cachedServerClient.GET("/v0/competitions/{competitionId}/events", {
    params: { path: { competitionId }, query: { wcif_version: "latest" } },
  });
}
