import React from 'react';
import { Header } from 'semantic-ui-react';
import EmailButton from '../EmailButton';
import { apiV0Urls } from '../../lib/requests/routes.js.erb';
import I18n from '../../lib/i18n';
import useLoadedData from '../../lib/hooks/useLoadedData';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';
import RolesTable from './RolesTable';

export default function GroupPage({ group, canViewPastRoles }) {
  const {
    data: activeRoles,
    loading: activeRolesLoading,
    error: activeRolesError,
  } = useLoadedData(apiV0Urls.userRoles.listOfGroup(group.id, 'status,name', { isActive: true }));
  const {
    data: pastRoles,
    loading: pastRolesLoading,
    error: pastRolesError,
  } = useLoadedData(apiV0Urls.userRoles.listOfGroup(group.id, 'status,name', { isActive: false }));

  if (activeRolesLoading || pastRolesLoading) return <Loading />;
  if (activeRolesError || pastRolesError) return <Errored />;

  return (
    <>
      <p>{I18n.t(`page.teams_committees_councils.groups_description.${group.metadata.friendly_id}`)}</p>
      <EmailButton email={group.metadata.email} />
      <RolesTable roleList={activeRoles} />
      {canViewPastRoles && (
        <>
          <Header>Past Roles</Header>
          <RolesTable roleList={pastRoles} />
        </>
      )}
    </>
  );
}
