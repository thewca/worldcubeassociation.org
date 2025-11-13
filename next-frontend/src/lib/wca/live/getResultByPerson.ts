import { serverClient } from "@/lib/wca/wcaAPI";
import { cache } from "react";

export const getResultByPerson = cache(
  async (competitionId: string, registrationId: string) => {
    return await serverClient.GET(
      "/v1/competitions/live/{competitionId}/registrations/{registrationId}",
      {
        params: { path: { competitionId, registrationId } },
      },
    );
  },
);
