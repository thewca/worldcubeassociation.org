import React from 'react';
import useLoadedData from './useLoadedData';
import { groupTypes } from '../wca-data.js.erb';
import { apiV0Urls } from '../requests/routes.js.erb';

export default function useLoggedInUserPermissions() {
  // FIXME: We won't be knowing whether the user is logged in or not. If the user is not logged in,
  // this will throw and error and even display the error in browser console, which won't be good.
  // THere are two possible solutions for this in long term:
  // 1. Handle the error when migrating from useLoadedData to react-query.
  // 2. Once we are in react-only environment, we can have a global state which will tell us whether
  // the user is logged in or not. But at that time, we won't even need this hook, as the
  // permissions can be fetched just once and stored in global state.
  const { data, loading } = useLoadedData(apiV0Urls.users.me.permissions);

  const loggedInUserPermissions = React.useMemo(() => ({
    canViewDelegateAdminPage: Boolean(data?.can_view_delegate_admin_page.scope === '*'),
    canEditRole: (role) => {
      const roleGroupType = role.group.group_type;
      const roleGroupId = role.group.id;

      switch (roleGroupType) {
        case groupTypes.delegate_regions:
          return Boolean(data?.can_edit_groups.scope === '*' || data?.can_edit_groups.scope.some((groupId) => groupId === roleGroupId));
        case groupTypes.teams_committees:
          return Boolean(data?.can_edit_teams_committees.scope === '*' || data?.can_edit_teams_committees.scope.some((groupId) => groupId === roleGroupId));
        case groupTypes.translators:
          return Boolean(data?.can_edit_translators.scope === '*');
        default:
          return false;
      }
    },
    canAccessWfcSeniorMatters: Boolean(data?.can_access_wfc_senior_matters.scope === '*'),
  }), [data]);

  return { loggedInUserPermissions, loading };
}
