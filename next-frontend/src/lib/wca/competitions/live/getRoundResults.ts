import { cache } from "react";
import { serverClient } from "@/lib/wca/wcaAPI";

export const getRoundResults = cache(
  async (competitionId: string, roundId: string) => {
    return await serverClient.GET(
      "/v1/competitions/{competitionId}/live/rounds/{roundId}",
      {
        params: { path: { competitionId, roundId } },
      },
    );
  },
);
