import { cache } from "react";
import { serverClient } from "@/lib/wca/wcaAPI";

export const getTeamsCommittees = cache(async () => {
  return await serverClient.GET("/v0/user_groups", {
    params: {
      query: {
        isActive: true,
        groupType: "teams_committees",
        isHidden: false,
      },
    },
  });
});
