import React from 'react';
import { Button, Header, List } from 'semantic-ui-react';
import useLoadedData from '../../lib/hooks/useLoadedData';
import {
  roleListUrl,
  updateRolePageUrl,
  newRolePageUrl,
} from '../../lib/requests/routes.js.erb';
import Errored from '../Requests/Errored';

const delegateRoleId = 'delegate'; // This is a temporary roleID for delegate edit page, which will be changed to proper ID after implementation of roles table.

export default function RolesTab({ userId }) {
  const { data, loading, error } = useLoadedData(roleListUrl(userId));

  if (loading) return 'Loading...';
  if (error) return <Errored />;

  return (data.activeRoles.length > 0
    ? (
      <>
        <Header>Active Roles</Header>
        <List>
          <List.Item>
            <a href={updateRolePageUrl(userId, delegateRoleId)}>Delegate</a>
          </List.Item>
        </List>
      </>
    ) : (
      <>
        <p>No Active Roles...</p>
        <Button href={newRolePageUrl(userId)}>New Role</Button>
      </>
    )
  );
}
