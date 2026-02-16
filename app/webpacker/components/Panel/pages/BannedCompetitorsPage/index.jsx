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
import usePagination from '../../../../lib/hooks/usePagination';

export default function BannedCompetitorsPage() {
  const bannedPagination = usePagination(50);
  const pastBannedPagination = usePagination(50);
  const {
    data: bannedCompetitorRoles,
    headers: bannedCompetitorHeaders,
    loading: bannedCompetitorRolesLoading,
    error: bannedCompetitorRolesError,
    sync: syncBannedCompetitorRoles,
  } = useLoadedData(apiV0Urls.userRoles.list({
    isActive: true,
    groupType: groupTypes.banned_competitors,
    page: bannedPagination.activePage,
  }, 'startDate', bannedPagination.entriesPerPage));
  const {
    data: pastBannedCompetitorRoles,
    headers: pastBannedCompetitorHeaders,
    loading: pastBannedCompetitorRolesLoading,
    error: pastBannedCompetitorRolesError,
    sync: syncPastBannedCompetitorRoles,
  } = useLoadedData(apiV0Urls.userRoles.list({
    isActive: false,
    groupType: groupTypes.banned_competitors,
    page: pastBannedPagination.activePage,
  }, 'startDate:desc', pastBannedPagination.entriesPerPage));
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

  const bannedTotalEntries = parseInt(bannedCompetitorHeaders.get('total'), 10);
  const bannedEntriesPerPage = parseInt(bannedCompetitorHeaders.get('per-page'), 10);
  const bannedTotalPages = Math.ceil(bannedTotalEntries / bannedEntriesPerPage);

  const pastTotalEntries = parseInt(pastBannedCompetitorHeaders.get('total'), 10);
  const pastEntriesPerPage = parseInt(pastBannedCompetitorHeaders.get('per-page'), 10);
  const pastTotalPages = Math.ceil(pastTotalEntries / pastEntriesPerPage);
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
          pagination={bannedPagination}
          totalPages={bannedTotalPages}
          toatlEntries={bannedTotalEntries}
        />
      </>
      <>
        <Header>Past Banned Competitors</Header>
        <BannedCompetitors
          bannedCompetitorRoles={pastBannedCompetitorRoles}
          canEditBannedCompetitors={canEditBannedCompetitors}
          editBannedCompetitor={setBanModalParams}
          pagination={pastBannedPagination}
          totalPages={pastTotalPages}
          toatlEntries={pastTotalEntries}
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
