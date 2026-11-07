import { getSession } from "@/auth";
import { serverClient, serverClientWithToken } from "@/lib/wca/wcaAPI";
import { cache } from "react";

export const getIncident = cache(async (id: string) => {
  const session = await getSession();
  const client = session
    ? serverClientWithToken(session.accessToken)
    : serverClient;

  return await client.GET("/v0/incidents/{id}", {
    params: { path: { id } },
  });
});
