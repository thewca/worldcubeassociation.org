import { cache } from "react";
import { serverClient } from "@/lib/wca/wcaAPI";

export const getRegulations = cache(async () => {
  return await serverClient.GET("/v0/regulations");
});

export const getHistoricalRegulations = cache(async (version: string) => {
  return await serverClient.GET("/v0/regulations/history/official/{version}", {
    params: { path: { version } },
  });
});

export const getTranslatedRegulations = cache(async (language: string) => {
  return await serverClient.GET("/v0/regulations/translations/{language}", {
    params: { path: { language } },
  });
});
