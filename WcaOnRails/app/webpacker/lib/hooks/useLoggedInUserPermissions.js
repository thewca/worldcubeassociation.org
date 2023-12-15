import React from 'react';
import useLoadedData from './useLoadedData';
import { permissionsUrl } from '../requests/routes.js.erb';

export default function useLoggedInUserPermissions() {
  const { data, loading, error } = useLoadedData(permissionsUrl);

  const loggedInUserPermissions = React.useMemo(() => {
    if (data) {
      return {
        canViewDelegateAdminPage: () => data.can_view_delegate_admin_page.scope === '*',
      };
    }
    return {};
  }, [data]);

  return { loggedInUserPermissions, loading, error };
}
