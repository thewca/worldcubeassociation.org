import { serverClient } from "@/lib/wca/wcaAPI";

import { teamCommitteeMembersQuery } from "@/lib/wca/roles/userRolesQuery";
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
  isActive: boolean,
) {
  return serverClient.GET("/v0/user_roles", {
    params: { query: teamCommitteeMembersQuery(groupId, isActive) },
  });
}
