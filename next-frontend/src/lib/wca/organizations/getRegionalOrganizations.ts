import { cachedServerClient } from "@/lib/wca/wcaAPI";
import { cacheLife } from "next/cache";

export async function getRegionalOrganizations() {
  "use cache";
  cacheLife("days");

  return cachedServerClient.GET("/v0/regional-organizations");
}
