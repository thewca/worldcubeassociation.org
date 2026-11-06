import { cachedServerClient } from "@/lib/wca/wcaAPI";

import { cacheLife } from "next/cache";

export async function getTeamsCommittees() {
  "use cache";
  cacheLife("hours");

  return cachedServerClient.GET("/v0/user_groups", {
    params: {
      query: {
        isActive: true,
        groupType: "teams_committees",
        isHidden: false,
      },
    },
  });
}

export async function getTeamCommitteeMembers(
  groupId: number,
  pastMembers: boolean = false,
) {
  "use cache";
  cacheLife("hours");

  return cachedServerClient.GET("/v0/user_roles", {
    params: {
      query: {
        groupId,
        isActive: pastMembers,
        sort: "status:desc,name:asc",
      },
    },
  });
}
