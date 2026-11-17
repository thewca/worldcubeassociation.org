import { cache } from "react";
import { serverClient } from "@/lib/wca/wcaAPI";

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
  return await serverClient.GET("/v1/user_roles/active", {
    params: {
      query: {
        group_id: groupId,
        sort: "location,name",
      },
    },
  });
});

export const getDelegatesInSubgroups = cache(async (groupId: number) => {
  return await serverClient.GET("/v1/user_roles/active", {
    params: {
      query: {
        parent_group_id: groupId,
        sort: "location,name",
      },
    },
  });
});
