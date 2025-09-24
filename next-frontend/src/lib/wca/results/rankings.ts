import { cache } from "react";
import { cachedServerClient } from "@/lib/wca/wcaAPI";

export const getRankings = cache(
  async (searchParams: {
    gender: string;
    region: string;
    show: string;
    eventId: string;
    type: string;
  }) => {
    return await cachedServerClient.GET(
      "/v0/results/rankings/{event_id}/{type}",
      {
        params: {
          query: {
            gender: searchParams.gender,
            region: searchParams.region,
            show: searchParams.show,
          },
          path: { event_id: searchParams.eventId, type: searchParams.type },
        },
      },
    );
  },
);
