import { cache } from "react";
import { serverClient } from "@/lib/wca/wcaAPI";

export const getRegulationsTranslations = cache(async () => {
  return await serverClient.GET("/regulations/translations");
});
