import { serverClient } from "@/lib/wca/wcaAPI";

import { cacheLife } from "next/cache";

export async function getRegulations() {
  "use cache";
  cacheLife("days");

  return serverClient.GET("/v0/regulations");
}

export async function getHistoricalRegulations(version: string) {
  "use cache";
  cacheLife("days");

  return serverClient.GET("/v0/regulations/history/official/{version}", {
    params: { path: { version } },
  });
}

export async function getTranslatedRegulations(language: string) {
  "use cache";
  cacheLife("days");

  return serverClient.GET("/v0/regulations/translations/{language}", {
    params: { path: { language } },
  });
}
