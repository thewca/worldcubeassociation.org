import { serverClient } from "@/lib/wca/wcaAPI";
import { cache } from "react";

export const getResultsByPerson = cache(async (wcaId: string) => {
  return await serverClient.GET("/persons/{wca_id}/", {
    params: { path: { wca_id: wcaId } },
  });
});
