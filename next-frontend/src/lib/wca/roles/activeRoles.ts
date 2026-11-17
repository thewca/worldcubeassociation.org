import { serverClient } from "@/lib/wca/wcaAPI";
import { operations } from "@/types/openapi";
import { cacheLife } from "next/cache";

type ActiveUserRolesQuery = NonNullable<
  operations["activeUserRoles"]["parameters"]["query"]
>;

async function getActiveRoles(query: ActiveUserRolesQuery) {
  "use cache";
  cacheLife("hours");

  return serverClient.GET("/v1/user_roles/active", { params: { query } });
}

const PAST_TEAM_COMMITTEE_MEMBERS_LIMIT = 100;

async function getPastTeamCommitteeMembers(groupId: number) {
  "use cache";
  cacheLife("hours");

  return serverClient.GET("/v0/user_roles", {
    params: {
      query: {
        groupId,
        isActive: false,
        sort: "status:desc,name:asc",
        per_page: PAST_TEAM_COMMITTEE_MEMBERS_LIMIT,
      },
    },
  });
}

export const getOfficersRoles = () =>
  getActiveRoles({ group_type: "officers" });
export const getBoardRoles = () => getActiveRoles({ group_type: "board" });
export const getTranslatorRoles = () =>
  getActiveRoles({ group_type: "translators" });
export const getTeamCommitteeMembers = (
  groupId: number,
  isActive: boolean = true,
) =>
  isActive
    ? getActiveRoles({ group_id: groupId, sort: "status:desc,name:asc" })
    : getPastTeamCommitteeMembers(groupId);
