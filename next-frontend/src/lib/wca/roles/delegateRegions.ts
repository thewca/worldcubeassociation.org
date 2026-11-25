import { cache } from "react";
import { serverClient } from "@/lib/wca/wcaAPI";
import {
  delegatesInGroupQuery,
  delegatesInSubgroupsQuery,
} from "@/lib/wca/roles/userRolesQuery";

export const getDelegateRegions = cache(async () => {
  return await serverClient.GET("/v0/user_groups", {
    params: {
      query: {
        isActive: true,
        groupType: "delegate_regions",
      },
    },
  });
});

export const getDelegatesInGroup = cache(async (groupId: number) => {
  return await serverClient.GET("/v0/user_roles", {
    params: { query: delegatesInGroupQuery(groupId) },
  });
});

export const getDelegatesInSubgroups = cache(async (groupId: number) => {
  return await serverClient.GET("/v0/user_roles", {
    params: { query: delegatesInSubgroupsQuery(groupId) },
  });
});
