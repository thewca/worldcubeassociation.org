import { cache } from "react";
import { serverClient } from "@/lib/wca/wcaAPI";

export const getTeamsCommittees = cache(async () => {
  return await serverClient.GET("/user_groups", {
    params: {
      query: {
        isActive: true,
        groupType: "teams_committees",
        isHidden: false,
      },
    },
  });
});

export const getTeamCommitteeMembers = cache(
  async (groupId: number, pastMembers: boolean = false) => {
    return await serverClient.GET("/user_roles", {
      params: {
        query: {
          groupId,
          isActive: pastMembers,
        },
      },
    });
  },
);
