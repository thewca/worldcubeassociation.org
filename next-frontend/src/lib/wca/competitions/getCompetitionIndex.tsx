import { serverClient } from "@/lib/wca/wcaAPI";
import { cache } from "react";

export const getCompetitionIndex = cache(async () => {
  return await serverClient.GET("/v0/competition_index");
});
