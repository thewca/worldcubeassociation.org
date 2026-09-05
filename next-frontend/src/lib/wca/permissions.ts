import { components } from "@/types/openapi";
import { cache } from "react";
import { serverClientWithToken } from "@/lib/wca/wcaAPI";
import { auth } from "@/auth";

export interface PermissionFunctions {
  canAccessPanel: (panel: string) => boolean;
  canAdministerCompetition: (competition: string) => boolean;
  canScoretakeCompetition: (competition: string) => boolean;
  canAttendCompetition: (competition: string) => boolean;
  canOrganizeCompetitions: (competition: string) => boolean;
  canEditDelegateReport: (competition: string) => boolean;
  canViewDelegateReport: (competition: string) => boolean;
  canCreateGroup: (group: string) => boolean;
  canEditGroup: (group: string) => boolean;
  canReadGroupCurrent: (group: string) => boolean;
  canReadGroupPast: (group: string) => boolean;
  canRequestToEditProfile: (profile: string) => boolean;
  // `can_manage_incidents` is granted to WRC and admins for every incident or none, so unlike its
  // siblings its scope is never a list of ids and there is nothing to pass in. The same holds for
  // `can_view_delegate_admin_page`.
  canManageIncidents: () => boolean;
  canViewDelegateAdminPage: () => boolean;
}

export type UserPermissions = components["schemas"]["UserPermissions"];

export interface PermissionContext extends PermissionFunctions {
  permissions?: UserPermissions;
}

const allOrSpecificScope = (
  item: string,
  scope: components["schemas"]["CompetitionPermissions"],
) => {
  return scope === "*" || scope.includes(item);
};

export const hydrateUserPermissions = (
  rawPermissions?: UserPermissions,
): PermissionFunctions => ({
  canAccessPanel: (panel) =>
    Boolean(
      rawPermissions && rawPermissions.can_access_panels.scope.includes(panel),
    ),
  canAdministerCompetition: (competition) =>
    Boolean(
      rawPermissions &&
      allOrSpecificScope(
        competition,
        rawPermissions.can_administer_competitions.scope,
      ),
    ),
  canScoretakeCompetition: (competition) =>
    Boolean(
      rawPermissions &&
      allOrSpecificScope(
        competition,
        rawPermissions.can_scoretake_competitions.scope,
      ),
    ),
  canAttendCompetition: (competition) =>
    Boolean(
      rawPermissions &&
      allOrSpecificScope(
        competition,
        rawPermissions.can_attend_competitions.scope,
      ),
    ),
  canOrganizeCompetitions: (competition) =>
    Boolean(
      rawPermissions &&
      allOrSpecificScope(
        competition,
        rawPermissions.can_organize_competitions.scope,
      ),
    ),
  canEditDelegateReport: (competition) =>
    Boolean(
      rawPermissions &&
      allOrSpecificScope(
        competition,
        rawPermissions.can_edit_delegate_report.scope,
      ),
    ),
  canViewDelegateReport: (competition) =>
    Boolean(
      rawPermissions &&
      allOrSpecificScope(
        competition,
        rawPermissions.can_view_delegate_report.scope,
      ),
    ),
  canCreateGroup: (group) =>
    Boolean(
      rawPermissions &&
      allOrSpecificScope(group, rawPermissions.can_create_groups.scope),
    ),
  canEditGroup: (group) =>
    Boolean(
      rawPermissions &&
      allOrSpecificScope(group, rawPermissions.can_edit_groups.scope),
    ),
  canReadGroupCurrent: (group) =>
    Boolean(
      rawPermissions &&
      allOrSpecificScope(group, rawPermissions.can_read_groups_current.scope),
    ),
  canReadGroupPast: (group) =>
    Boolean(
      rawPermissions &&
      allOrSpecificScope(group, rawPermissions.can_read_groups_past.scope),
    ),
  canRequestToEditProfile: (profile) =>
    Boolean(
      rawPermissions &&
      allOrSpecificScope(
        profile,
        rawPermissions.can_request_to_edit_others_profile.scope,
      ),
    ),
  canManageIncidents: () => rawPermissions?.can_manage_incidents.scope === "*",
  canViewDelegateAdminPage: () =>
    rawPermissions?.can_view_delegate_admin_page.scope === "*",
});

const fetchPermissions = cache(async (authToken: string) => {
  const client = serverClientWithToken(authToken);

  return await client.GET("/v0/users/me/permissions");
});

export const getPermissions = async () => {
  const session = await auth();

  if (!session) {
    return null;
  }

  const { data: rawPermissions } = await fetchPermissions(session.accessToken);

  return {
    permissions: rawPermissions,
    ...hydrateUserPermissions(rawPermissions),
  } as PermissionContext;
};

export default getPermissions;
