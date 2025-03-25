import { serverClient } from "@/lib/wca/wcaAPI";
import { cache } from "react";

export const getResultsByPerson = cache(async (wca_id: string) => {
  return await serverClient.GET("/person/{wca_id}/", {
    params: { path: { wca_id } },
  });
});
