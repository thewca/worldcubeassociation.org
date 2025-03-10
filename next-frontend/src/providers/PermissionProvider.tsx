"use client";

import React, { createContext, useContext, useMemo } from "react";
import { components} from "@/lib/wca/wcaSchema";
import { useQuery } from "@tanstack/react-query";
import useAPI from "@/lib/wca/useAPI";
import { useSession } from "next-auth/react";

interface PermissionContext {
  permissions?: components["schemas"]["UserPermissions"]
  canAccessPanel: (panel: string) => boolean
  canAdministerCompetition: (competition: string) => boolean
  canAttendCompetition: (competition: string) => boolean
  canOrganizeCompetitions: (competition: string) => boolean
  canEditDelegateReport: (competition: string) => boolean
  canViewDelegateAdminPage: (competition: string) => boolean
  canViewDelegateReport: (competition: string) => boolean
  canCreateGroup: (group: string) => boolean
  canEditGroup: (group: string) => boolean
  canReadGroupCurrent: (group: string) => boolean
  canReadGroupPast: (group: string) => boolean
  canRequestToEditProfile: (profile: string) => boolean
}

const PermissionContext = createContext<PermissionContext | null>(null);

export const usePermissions = () => useContext(PermissionContext);

const allOrSpecificScope = (item: string, scope: components["schemas"]["CompetitionPermissions"]) => {
  return scope === "*" || scope.includes(item)
}

export default function PermissionProvider({ children }: { children: React.ReactNode }){
  const { data: session } = useSession();
  const api = useAPI();
  const { data: request, isLoading } = useQuery({
    enabled: Boolean(session),
    queryKey: ["permissions", session?.user?.id],
    queryFn: () => api.GET("/users/me/permissions")
  })

  const permissions: PermissionContext = useMemo(() => {
    const rawPermissions = request?.data

    return {
      permissions: rawPermissions,
      canAccessPanel: panel => Boolean(rawPermissions && rawPermissions.can_access_panels.scope.includes(panel)),
      canAdministerCompetition: competition => Boolean(rawPermissions && allOrSpecificScope(competition, rawPermissions.can_administer_competitions.scope)),
      canAttendCompetition: competition => Boolean(rawPermissions && allOrSpecificScope(competition, rawPermissions.can_attend_competitions.scope)),
      canOrganizeCompetitions: competition => Boolean(rawPermissions && allOrSpecificScope(competition, rawPermissions.can_organize_competitions.scope)),
      canEditDelegateReport: competition => Boolean(rawPermissions && allOrSpecificScope(competition, rawPermissions.can_edit_delegate_report.scope)),
      canViewDelegateReport: competition => Boolean(rawPermissions && allOrSpecificScope(competition, rawPermissions.can_view_delegate_report.scope)),
      canViewDelegateAdminPage: competition => Boolean(rawPermissions && allOrSpecificScope(competition, rawPermissions.can_view_delegate_admin_page.scope)),
      canCreateGroup: group => Boolean(rawPermissions && rawPermissions.can_create_groups.scope.includes(group)),
      canEditGroup: group => Boolean(rawPermissions && rawPermissions.can_edit_groups.scope.includes(group)),
      canReadGroupCurrent: group => Boolean(rawPermissions && rawPermissions.can_read_groups_current.scope.includes(group)),
      canReadGroupPast: group => Boolean(rawPermissions && rawPermissions.can_read_groups_past.scope.includes(group)),
      canRequestToEditProfile: profile => Boolean(rawPermissions && allOrSpecificScope(profile, rawPermissions.can_request_to_edit_others_profile.scope)),
    }
  }, [request])

  if(isLoading) {
    return (
      <p>Loading...</p>
    )
  }

  return (
    <PermissionContext.Provider value={permissions}>
      {children}
    </PermissionContext.Provider>
  )
}
