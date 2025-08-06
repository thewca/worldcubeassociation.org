import { cache } from "react";
import { serverClient } from "@/lib/wca/wcaAPI";

export const getRecords = cache(async () => {
  return await serverClient.GET("/results/records");
});
