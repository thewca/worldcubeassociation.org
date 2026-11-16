import { serverClient } from "@/lib/wca/wcaAPI";

import { cacheLife } from "next/cache";

export async function getLiveCompetitions() {
  "use cache";
  cacheLife("minutes");

  return serverClient.GET("/v1/competitions/live");
}
