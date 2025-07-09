import { serverClient } from "@/lib/wca/wcaAPI";
import { cache } from "react";

export const getRegionalOrganizations = cache(async () => {
  return await serverClient.GET("/regional-organizations");
});
