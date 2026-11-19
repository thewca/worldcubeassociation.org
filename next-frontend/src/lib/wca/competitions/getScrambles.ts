import { serverClient } from "@/lib/wca/wcaAPI";

import { cacheLife } from "next/cache";

export async function getScrambles(competitionId: string) {
  "use cache: remote";
  cacheLife("hours");

  return serverClient.GET("/v0/competitions/{competitionId}/scrambles", {
    params: { path: { competitionId } },
  });
}
