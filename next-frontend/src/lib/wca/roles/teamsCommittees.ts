import { serverClient } from "@/lib/wca/wcaAPI";

import { cacheLife } from "next/cache";

export async function getTeamsCommittees() {
  "use cache: remote";
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

export async function getTeamCommitteeMembers(
  groupId: number,
  pastMembers: boolean = false,
) {
  "use cache: remote";
  cacheLife("hours");

  return serverClient.GET("/v0/user_roles", {
    params: {
      query: {
        groupId,
        isActive: pastMembers,
        sort: "status:desc,name:asc",
      },
    },
  });
}
