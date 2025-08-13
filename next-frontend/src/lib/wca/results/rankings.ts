import { cache } from "react";
import { serverClient } from "@/lib/wca/wcaAPI";

export const getRankings = cache(
  async (searchParams: {
    gender: string;
    region: string;
    show: string;
    eventId: string;
    type: string;
  }) => {
    return await serverClient.GET("/results/rankings/{event_id}/{type}", {
      params: {
        query: searchParams,
        path: { event_id: searchParams.eventId, type: searchParams.type },
      },
    });
  },
);
