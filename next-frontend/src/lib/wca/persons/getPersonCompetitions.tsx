import { serverClient } from "@/lib/wca/wcaAPI";
import { cache } from "react";

export const getPersonCompetitions = cache(async (wcaId: string) => {
  return await serverClient.GET("/v0/persons/{wca_id}/competitions", {
    params: { path: { wca_id: wcaId } },
  });
});
