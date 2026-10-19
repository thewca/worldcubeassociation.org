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
  return await serverClient.GET("/v0/user_roles", {
    params: {
      query: {
        groupId,
        isActive: true,
        sort: "location,name",
      },
    },
  });
});

export const getDelegatesInSubgroups = cache(async (groupId: number) => {
  return await serverClient.GET("/v0/user_roles", {
    params: {
      query: {
        parentGroupId: groupId,
        isActive: true,
        sort: "location,name",
      },
    },
  });
});
