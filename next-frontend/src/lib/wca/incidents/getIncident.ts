import { getSession } from "@/auth";
import { cachedServerClient, serverClientWithToken } from "@/lib/wca/wcaAPI";
import { cacheLife } from "next/cache";
import { cache } from "react";

async function getPublicIncident(id: string) {
  "use cache";
  cacheLife("days");

  return cachedServerClient.GET("/v0/incidents/{id}", {
    params: { path: { id } },
  });
}

export const getIncident = cache(async (id: string) => {
  const session = await getSession();

  if (!session) return getPublicIncident(id);

  return await serverClientWithToken(session.accessToken).GET(
    "/v0/incidents/{id}",
    { params: { path: { id } } },
  );
});
