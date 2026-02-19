import { serverClient } from "@/lib/wca/wcaAPI";
import { cache } from "react";

export const getLivePodiums = cache(async (competitionId: string) => {
  return await serverClient.GET(
    "/v1/competitions/{competitionId}/live/podiums",
    {
      params: { path: { competitionId } },
    },
  );
});
