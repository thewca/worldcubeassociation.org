import React from 'react';
import useLoadedData from './useLoadedData';
import { rolesOfUser } from '../requests/routes.js.erb';
import {
  DELEGATE_STATUS, GROUP_TYPE, TEAMS_COMMITTEES_STATUS,
} from '../helpers/user-groups-and-roles-constants';

export default function useRoleData(userId, { isActive, isGroupHidden }) {
  const { data, loading, error } = useLoadedData(rolesOfUser(userId, { isActive, isGroupHidden }));

  const role = React.useMemo(() => {
    if (data) {
      const rolesMap = {};

      data.forEach((_role) => {
        rolesMap[_role.group.id] = _role;
      });

      return {

        isAdmin: () => !!rolesMap.admin,

        isBoard: () => !!rolesMap.board,

        canEditRole: (_role) => {
          const roleGroupType = _role.group.group_type;

          switch (roleGroupType) {
            case GROUP_TYPE.DELEGATE_REGIONS:
              return (rolesMap[_role.group.id]?.metadata.status === DELEGATE_STATUS.SENIOR_DELEGATE
                || rolesMap.admin || rolesMap.board);
            case GROUP_TYPE.TEAMS_COMMITTEES:
              return (rolesMap[_role.group.id]?.metadata.status === TEAMS_COMMITTEES_STATUS.LEADER
                || rolesMap.admin || rolesMap.board);
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
