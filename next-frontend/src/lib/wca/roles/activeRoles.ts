import { serverClient } from "@/lib/wca/wcaAPI";
import { operations } from "@/types/openapi";
import { cacheLife } from "next/cache";

type UserRolesQuery = NonNullable<
  operations["userRoles"]["parameters"]["query"]
>;

async function getRoles(query: UserRolesQuery) {
  "use cache";
  cacheLife("hours");

  return serverClient.GET("/v0/user_roles", { params: { query } });
}

export const getOfficersRoles = () =>
  getRoles({ isActive: true, groupType: "officers" });
export const getBoardRoles = () =>
  getRoles({ isActive: true, groupType: "board" });
export const getTranslatorRoles = () =>
  getRoles({ isActive: true, groupType: "translators" });
export const getTeamCommitteeMembers = (
  groupId: number,
  isActive: boolean = true,
) =>
  getRoles({
    groupId,
    isActive,
    sort: "status:desc,name:asc",
    per_page: 100,
  });
