import { serverClient } from "@/lib/wca/wcaAPI";

import { cacheLife } from "next/cache";

export async function getExportDetails() {
  "use cache: remote";
  cacheLife("days");

  return serverClient.GET("/v0/export/public");
}
