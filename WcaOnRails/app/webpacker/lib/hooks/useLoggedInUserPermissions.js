import React from 'react';
import useLoadedData from './useLoadedData';
import { permissionsUrl } from '../requests/routes.js.erb';
import { groupTypes } from '../wca-data.js.erb';

export default function useLoggedInUserPermissions() {
  const { data, loading, error } = useLoadedData(permissionsUrl);

  const loggedInUserPermissions = React.useMemo(() => {
    if (data) {
      return {
        canEditRole: (_role) => {
          const roleGroupType = _role.group.group_type;
          const roleGroupId = _role.group.id;

          switch (roleGroupType) {
            case groupTypes.delegate_regions:
              return data.can_edit_delegate_regions.scope === '*' || data.can_edit_delegate_regions.scope.some((groupId) => groupId === roleGroupId);
            case groupTypes.teams_committees:
              return data.can_edit_teams_committees.scope === '*' || data.can_edit_teams_committees.scope.some((groupId) => groupId === roleGroupId);
            default:
              return false;
          }
        },
      };
    }
    return {};
  }, [data]);

  return { loggedInUserPermissions, loading, error };
}
