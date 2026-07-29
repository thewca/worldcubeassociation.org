import React, { useCallback, useMemo } from 'react';
import useLoadedData from '../../../../lib/hooks/useLoadedData';
import { apiV0Urls } from '../../../../lib/requests/routes.js.erb';
import { groupTypes } from '../../../../lib/wca-data.js.erb';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';
import LeadersAdmin from './LeadersAdmin';

export default function LeadersAdminPage() {
  const {
    data: teamsCommittees,
    loading: teamsCommitteesLoading,
    error: teamsCommitteesError,
    sync: teamsCommitteesSync,
  } = useLoadedData(apiV0Urls.userGroups.list(groupTypes.teams_committees));
  const {
    data: councils,
    loading: councilsLoading,
    error: councilsError,
    sync: councilsSync,
  } = useLoadedData(apiV0Urls.userGroups.list(groupTypes.councils));

  const groups = useMemo(() => [
    ...(teamsCommittees || []),
    ...(councils || []),
  ], [councils, teamsCommittees]);

  const sync = useCallback((group) => {
    if (group.group_type === groupTypes.teams_committees) {
      teamsCommitteesSync();
    } else {
      councilsSync();
    }
  }, [councilsSync, teamsCommitteesSync]);

  if (teamsCommitteesLoading || councilsLoading) return <Loading />;
  if (teamsCommitteesError || councilsError) return <Errored />;

  return (
    <LeadersAdmin
      groups={groups}
      sync={sync}
    />
  );
}
