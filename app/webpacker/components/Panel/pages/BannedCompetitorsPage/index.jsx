import React from 'react';
import { Header } from 'semantic-ui-react';
import useLoadedData from '../../../../lib/hooks/useLoadedData';
import { apiV0Urls } from '../../../../lib/requests/routes.js.erb';
import { groupTypes } from '../../../../lib/wca-data.js.erb';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';
import BannedCompetitors from './BannedCompetitors';
import useLoggedInUserPermissions from '../../../../lib/hooks/useLoggedInUserPermissions';

export default function BannedCompetitorsPage() {
  const {
    data: bannedCompetitorRoles,
    loading: bannedCompetitorRolesLoading,
    error: bannedCompetitorRolesError,
    sync,
  } = useLoadedData(apiV0Urls.userRoles.listOfGroupType(groupTypes.banned_competitors, 'startDate', {
    isActive: true,
  }));
  const {
    data: pastBannedCompetitorRoles,
    loading: pastBannedCompetitorRolesLoading,
    error: pastBannedCompetitorRolesError,
  } = useLoadedData(apiV0Urls.userRoles.listOfGroupType(groupTypes.banned_competitors, 'startDate', {
    isActive: false,
  }));
  const {
    data: bannedGroups,
    loading: bannedGroupLoading,
    error: bannedGroupError,
  } = useLoadedData(apiV0Urls.userGroups.list(groupTypes.banned_competitors));
  const { loggedInUserPermissions, permissionsLoading } = useLoggedInUserPermissions();

  if (bannedCompetitorRolesLoading || pastBannedCompetitorRolesLoading
    || bannedGroupLoading || permissionsLoading) {
    return <Loading />;
  }
  if (bannedCompetitorRolesError || pastBannedCompetitorRolesError || bannedGroupError) {
    return <Errored />;
  }

  const canEditBannedCompetitors = bannedGroups.some(
    (bannedGroup) => loggedInUserPermissions.canEditGroup(bannedGroup.id),
  );

  return (
    <>
      <Header>Banned Competitors</Header>
      <BannedCompetitors
        bannedCompetitorRoles={bannedCompetitorRoles}
        sync={sync}
        canEditBannedCompetitors={canEditBannedCompetitors}
      />
      <Header>Past Banned Competitors</Header>
      <BannedCompetitors bannedCompetitorRoles={pastBannedCompetitorRoles} />
    </>
  );
}
