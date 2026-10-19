import { serverClient } from "@/lib/wca/wcaAPI";
import { operations } from "@/types/openapi";
import { cache } from "react";

type UserRolesQuery = NonNullable<
  operations["userRoles"]["parameters"]["query"]
>;

const getRoles = (query: UserRolesQuery) =>
  serverClient.GET("/v0/user_roles", { params: { query } });

export const getOfficersRoles = cache(() =>
  getRoles({ isActive: true, groupType: "officers" }),
);
export const getBoardRoles = cache(() =>
  getRoles({ isActive: true, groupType: "board" }),
);
export const getTranslatorRoles = cache(() =>
  getRoles({ isActive: true, groupType: "translators" }),
);
export const getTeamCommitteeMembers = cache(
  (groupId: number, isActive: boolean = true) =>
    getRoles({
      groupId,
      isActive,
      sort: "status:desc,name:asc",
      per_page: 100,
    }),
);
