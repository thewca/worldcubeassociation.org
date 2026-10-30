import { cachedServerClient } from "@/lib/wca/wcaAPI";

import { cacheLife } from "next/cache";

export async function getRegulationsTranslations() {
  "use cache";
  cacheLife("days");

  return cachedServerClient.GET("/v0/regulations/translations");
}
