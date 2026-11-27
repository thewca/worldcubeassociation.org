import type { paths } from "@/types/openapi";

export const ROLES_PER_PAGE = 50;

export type UserRolesQuery = NonNullable<
  paths["/v0/user_roles"]["get"]["parameters"]["query"]
>;

export const delegatesInGroupQuery = (groupId: number): UserRolesQuery => ({
  groupId,
  isActive: true,
  // Regional Delegates have to come first, because their other roles are hidden from the list.
  sort: "lead,location,name",
  per_page: ROLES_PER_PAGE,
});

export const delegatesInSubgroupsQuery = (groupId: number): UserRolesQuery => ({
  parentGroupId: groupId,
  isActive: true,
  // Keeps every subregion contiguous, so that further pages only ever append to the list.
  sort: "groupName,lead,location,name",
  per_page: ROLES_PER_PAGE,
});

export const teamCommitteeMembersQuery = (
  groupId: number,
  isActive: boolean,
): UserRolesQuery => ({
  groupId,
  isActive,
  sort: "status:desc,name:asc",
  per_page: ROLES_PER_PAGE,
});
