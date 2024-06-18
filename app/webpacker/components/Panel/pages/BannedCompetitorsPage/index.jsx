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
  } = useLoadedData(apiV0Urls.userRoles.list({
    isActive: true,
    groupType: groupTypes.banned_competitors,
  }, 'startDate'));
  const {
    data: pastBannedCompetitorRoles,
    loading: pastBannedCompetitorRolesLoading,
    error: pastBannedCompetitorRolesError,
  } = useLoadedData(apiV0Urls.userRoles.list({
    isActive: false,
    groupType: groupTypes.banned_competitors,
  }, 'startDate'));
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

  if (bannedCompetitorRoles.length === 0 && pastBannedCompetitorRoles.length === 0) {
    return 'No data to show.';
  }

  return (
    <>
      {bannedCompetitorRoles.length > 0 && (
        <>
          <Header>Banned Competitors</Header>
          <BannedCompetitors
            bannedCompetitorRoles={bannedCompetitorRoles}
            sync={sync}
            canEditBannedCompetitors={canEditBannedCompetitors}
          />
        </>
      )}
      {pastBannedCompetitorRoles.length > 0 && (
        <>
          <Header>Past Banned Competitors</Header>
          <BannedCompetitors bannedCompetitorRoles={pastBannedCompetitorRoles} />
        </>
      )}
    </>
  );
}
