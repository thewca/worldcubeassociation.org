import { serverClient } from "@/lib/wca/wcaAPI";

import { cacheLife } from "next/cache";

export async function getEvents(competitionId: string) {
  "use cache";
  cacheLife("minutes");

  return serverClient.GET("/v0/competitions/{competitionId}/events", {
    params: { path: { competitionId }, query: { wcif_version: "latest" } },
  });
}
