import { cache } from "react";
import { serverClient } from "@/lib/wca/wcaAPI";

export const getExportDetails = cache(async () => {
  return await serverClient.GET("/export/public");
});
