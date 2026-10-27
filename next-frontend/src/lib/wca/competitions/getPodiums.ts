import { cachedServerClient } from "@/lib/wca/wcaAPI";

import { cacheLife } from "next/cache";

export async function getPodiums(competitionId: string) {
  "use cache";
  cacheLife("hours");

  return cachedServerClient.GET("/v1/competitions/{competitionId}/podiums", {
    params: { path: { competitionId } },
  });
}
