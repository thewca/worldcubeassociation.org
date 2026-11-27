import { serverClient } from "@/lib/wca/wcaAPI";
import { cache } from "react";

export const getPersonInfo = cache(async (wcaId: string) => {
  return await serverClient.GET("/v1/persons/{wca_id}", {
    params: { path: { wca_id: wcaId } },
  });
});
