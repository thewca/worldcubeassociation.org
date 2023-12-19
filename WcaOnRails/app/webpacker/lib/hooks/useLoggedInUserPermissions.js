import React from 'react';
import useLoadedData from './useLoadedData';
import { permissionsUrl } from '../requests/routes.js.erb';

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
  }), [data]);

  return { loggedInUserPermissions, loading };
}
