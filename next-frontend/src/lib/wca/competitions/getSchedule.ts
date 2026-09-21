import { cachedServerClient } from "@/lib/wca/wcaAPI";

import { cacheLife } from "next/cache";

export async function getSchedule(competitionId: string) {
  "use cache";
  cacheLife("minutes");

  return cachedServerClient.GET("/v0/competitions/{competitionId}/schedule", {
    params: { path: { competitionId } },
  });
}
