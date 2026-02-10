import React, { useState } from 'react';
import { Header, Button, Modal } from 'semantic-ui-react';
import useLoadedData from '../../../../lib/hooks/useLoadedData';
import { apiV0Urls } from '../../../../lib/requests/routes.js.erb';
import { groupTypes } from '../../../../lib/wca-data.js.erb';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';
import BannedCompetitors from './BannedCompetitors';
import useLoggedInUserPermissions from '../../../../lib/hooks/useLoggedInUserPermissions';
import BannedCompetitorForm from './BannedCompetitorForm';

export default function BannedCompetitorsPage() {
  const {
    data: bannedCompetitorRoles,
    loading: bannedCompetitorRolesLoading,
    error: bannedCompetitorRolesError,
    sync: syncBannedCompetitorRoles,
  } = useLoadedData(apiV0Urls.userRoles.list({
    isActive: true,
    groupType: groupTypes.banned_competitors,
  }, 'startDate', 500));
  const {
    data: pastBannedCompetitorRoles,
    loading: pastBannedCompetitorRolesLoading,
    error: pastBannedCompetitorRolesError,
    sync: syncPastBannedCompetitorRoles,
  } = useLoadedData(apiV0Urls.userRoles.list({
    isActive: false,
    groupType: groupTypes.banned_competitors,
  }, 'startDate:desc', 500));
  const {
    data: bannedGroups,
    loading: bannedGroupLoading,
    error: bannedGroupError,
  } = useLoadedData(apiV0Urls.userGroups.list(groupTypes.banned_competitors));
  const { loggedInUserPermissions, permissionsLoading } = useLoggedInUserPermissions();

  const [banModalParams, setBanModalParams] = useState(null);

  if (
    bannedCompetitorRolesLoading
    || pastBannedCompetitorRolesLoading
    || bannedGroupLoading
    || permissionsLoading
  ) {
    return <Loading />;
  }
  if (
    bannedCompetitorRolesError
    || pastBannedCompetitorRolesError
    || bannedGroupError
  ) {
    return <Errored />;
  }

  const canEditBannedCompetitors = bannedGroups
    .some((bannedGroup) => loggedInUserPermissions.canEditGroup(bannedGroup.id));

  return (
    <>
      <>
        <Header>Banned Competitors</Header>
        {canEditBannedCompetitors && (
        <Button onClick={() => setBanModalParams({ action: 'new' })}>
          Ban new competitor
        </Button>
        )}
        <BannedCompetitors
          bannedCompetitorRoles={bannedCompetitorRoles}
          canEditBannedCompetitors={canEditBannedCompetitors}
          editBannedCompetitor={setBanModalParams}
        />
      </>
      <>
        <Header>Past Banned Competitors</Header>
        <BannedCompetitors
          bannedCompetitorRoles={pastBannedCompetitorRoles}
          canEditBannedCompetitors={canEditBannedCompetitors}
          editBannedCompetitor={setBanModalParams}
        />
      </>
      <Modal open={!!banModalParams} onClose={() => setBanModalParams(null)}>
        <Modal.Header>Add/Edit Banned Competitor</Modal.Header>
        <Modal.Content>
          <BannedCompetitorForm
            sync={() => {
              syncBannedCompetitorRoles();
              syncPastBannedCompetitorRoles();
            }}
            banAction={banModalParams?.action}
            banActionRole={banModalParams?.role}
            closeForm={() => setBanModalParams(null)}
          />
        </Modal.Content>
      </Modal>
    </>
  );
}
