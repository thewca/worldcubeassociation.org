import React from 'react';
import useLoadedData from './useLoadedData';
import { permissionsUrl } from '../requests/routes.js.erb';
import { groupTypes } from '../wca-data.js.erb';

export default function useLoggedInUserPermissions() {
  // FIXME: We won't be knowing whether the user is logged in or not. If the user is not logged in,
  // this will throw and error and even display the error in browser console, which won't be good.
  // THere are two possible solutions for this in long term:
  // 1. Handle the error when migrating from useLoadedData to react-query.
  // 2. Once we are in react-only environment, we can have a global state which will tell us whether
  // the user is logged in or not. But at that time, we won't even need this hook, as the
  // permissions can be fetched just once and stored in global state.
  const { data, loading } = useLoadedData(permissionsUrl);

  const loggedInUserPermissions = React.useMemo(() => ({
    canViewDelegateAdminPage: () => Boolean(data?.can_view_delegate_admin_page.scope === '*'),
    canEditRole: (role) => {
      const roleGroupType = role.group.group_type;
      const roleGroupId = role.group.id;

      switch (roleGroupType) {
        case groupTypes.delegate_regions:
          return Boolean(data?.can_edit_delegate_regions.scope === '*' || data?.can_edit_delegate_regions.scope.some((groupId) => groupId === roleGroupId));
        case groupTypes.teams_committees:
          return Boolean(data?.can_edit_teams_committees.scope === '*' || data?.can_edit_teams_committees.scope.some((groupId) => groupId === roleGroupId));
        default:
          return false;
      }
    },
  }), [data]);

  return { loggedInUserPermissions, loading };
}
