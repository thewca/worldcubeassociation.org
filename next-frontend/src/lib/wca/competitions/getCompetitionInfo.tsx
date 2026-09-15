import { serverClient } from "@/lib/wca/wcaAPI";
import { toErrorDetails } from "@/components/ui/openapiError";

import { cacheLife } from "next/cache";

export async function getCompetitionInfo(competitionId: string) {
  "use cache";
  cacheLife("minutes");

  // `Response` cannot cross a `"use cache"` boundary, so we only keep the parts
  //   that `OpenapiError` renders.
  const result = await serverClient.GET("/v0/competitions/{competitionId}/", {
    params: { path: { competitionId } },
  });

  return { ...result, response: toErrorDetails(result.response) };
}
