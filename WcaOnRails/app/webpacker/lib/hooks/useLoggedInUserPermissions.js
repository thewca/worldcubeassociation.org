import React from 'react';
import useLoadedData from './useLoadedData';
import { permissionsUrl } from '../requests/routes.js.erb';
import { GROUP_TYPE } from '../helpers/user-groups-and-roles-constants';

export default function useLoggedInUserPermissions() {
  const { data, loading, error } = useLoadedData(permissionsUrl);

  const role = React.useMemo(() => {
    if (data) {
      return {
        canEditRole: (_role) => {
          const roleGroupType = _role.group.group_type;
          const roleGroupId = _role.group.id;

          switch (roleGroupType) {
            case GROUP_TYPE.DELEGATE_REGIONS:
              return data.can_edit_delegate_regions.scope === '*' || data.can_edit_delegate_regions.scope.some((groupId) => groupId === roleGroupId);
            case GROUP_TYPE.TEAMS_COMMITTEES:
              return data.can_edit_teams_committees.scope === '*' || data.can_edit_teams_committees.scope.some((groupId) => groupId === roleGroupId);
            default:
              return false;
          }
        },
      };
    }
    return {};
  }, [data]);

  return [role, loading, error];
}
