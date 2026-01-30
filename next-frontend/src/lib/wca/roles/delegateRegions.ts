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

export const getDelegatesInGroups = cache(async (groupId: number) => {
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
