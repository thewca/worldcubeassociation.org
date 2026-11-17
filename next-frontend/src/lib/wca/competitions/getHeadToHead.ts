import { serverClient } from "@/lib/wca/wcaAPI";

import { cacheLife } from "next/cache";

export async function getHeadToHead(competitionId: string) {
  "use cache";
  cacheLife("hours");

  return serverClient.GET("/v1/competitions/{competitionId}/head-to-head", {
    params: { path: { competitionId } },
  });
}
