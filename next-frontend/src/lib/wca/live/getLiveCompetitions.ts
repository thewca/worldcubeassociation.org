import { cachedServerClient } from "@/lib/wca/wcaAPI";

import { cacheLife } from "next/cache";

export async function getLiveCompetitions() {
  "use cache";
  cacheLife("minutes");

  return cachedServerClient.GET("/v1/competitions/live");
}
