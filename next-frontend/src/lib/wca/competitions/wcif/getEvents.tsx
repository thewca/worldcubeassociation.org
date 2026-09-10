import { serverClient } from "@/lib/wca/wcaAPI";
import { toErrorDetails } from "@/components/ui/openapiError";

import { cacheLife } from "next/cache";

export async function getEvents(competitionId: string) {
  "use cache";
  cacheLife("minutes");

  // `Response` cannot cross a `"use cache"` boundary, so we only keep the parts
  //   that `OpenapiError` renders.
  const result = await serverClient.GET(
    "/v0/competitions/{competitionId}/events",
    {
      params: { path: { competitionId }, query: { wcif_version: "latest" } },
    },
  );

  return { ...result, response: toErrorDetails(result.response) };
}
