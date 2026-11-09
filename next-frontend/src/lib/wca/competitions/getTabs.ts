import { serverClient } from "@/lib/wca/wcaAPI";

import { cacheLife } from "next/cache";

export async function getTabs(competitionId: string) {
  "use cache";
  cacheLife("minutes");

  return serverClient.GET("/v0/competitions/{competitionId}/tabs", {
    params: { path: { competitionId } },
  });
}
