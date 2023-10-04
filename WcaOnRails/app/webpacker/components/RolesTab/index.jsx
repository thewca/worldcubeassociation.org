import React from 'react';
import { Button } from 'semantic-ui-react';
import useLoadedData from '../../lib/hooks/useLoadedData';
import { roleListUrl } from '../../lib/requests/routes.js.erb';
import Errored from '../Requests/Errored';

export default function RolesTab() {
  const userId = window.location.pathname.split('/')[2];
  const { data, loading, error } = useLoadedData(roleListUrl(userId));

  if (loading) return 'Loading...';
  if (error) return <Errored />;

  return (data.activeRoles.length > 0
    ? (
      <>
        <h1>Active Roles</h1>
        <ul>
          <li>
            <a href={`/users/${userId}/role/delegate`}>Delegate</a>
          </li>
        </ul>
      </>
    ) : (
      <>
        <p>No Active Roles...</p>
        <Button href={`/users/${userId}/role/new`}>New Role</Button>
      </>
    )
  );
}
