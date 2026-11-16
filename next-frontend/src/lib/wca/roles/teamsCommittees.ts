import { serverClient } from "@/lib/wca/wcaAPI";

import { cacheLife } from "next/cache";

export async function getTeamsCommittees() {
  "use cache";
  cacheLife("hours");

  return serverClient.GET("/v0/user_groups", {
    params: {
      query: {
        isActive: true,
        groupType: "teams_committees",
        isHidden: false,
      },
    },
  });
}
