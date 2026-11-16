import { serverClient } from "@/lib/wca/wcaAPI";
import { cacheLife } from "next/cache";

export async function getRegionalOrganizations() {
  "use cache";
  cacheLife("days");

  return serverClient.GET("/v0/regional-organizations");
}
