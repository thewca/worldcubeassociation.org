import { serverClient } from "@/lib/wca/wcaAPI";
import { cache } from "react";

export const getResultByRound = cache(
  async (competitionId: string, roundId: string) => {
    return await serverClient.GET(
      "/v1/competitions/{competitionId}/live/rounds/{roundId}",
      {
        params: { path: { competitionId, roundId } },
      },
    );
  },
);
