import { serverClient } from "@/lib/wca/wcaAPI";
import type { ErrorDetails } from "@/components/ui/openapiError";

import { cacheLife } from "next/cache";

export async function getTabs(competitionId: string) {
  "use cache";
  cacheLife("minutes");

  const { data, error, response } = await serverClient.GET(
    "/v0/competitions/{competitionId}/tabs",
    { params: { path: { competitionId } } },
  );

  if (error) {
    const errorDetails: ErrorDetails = {
      status: response.status,
      url: response.url,
      statusText: response.statusText,
      requestId: response.headers.get("x-request-id"),
    };

    return { tabs: null, errorDetails };
  }

  return { tabs: data, errorDetails: null };
}
