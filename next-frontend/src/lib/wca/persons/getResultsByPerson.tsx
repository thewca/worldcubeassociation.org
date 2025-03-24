import { internalClient } from "@/lib/wca/wcaAPI";
import { cache } from "react";

export const getResultsByPerson = cache(async (personId: string) => {
  return await internalClient.GET("/{personId}/results/", {
    params: { path: { personId } },
  });
});
