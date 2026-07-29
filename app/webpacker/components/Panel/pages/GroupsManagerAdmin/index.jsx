import React from 'react';
import { GroupsManagerForGroups } from '../GroupsManager';
import { apiV0Urls } from '../../../../lib/requests/routes.js.erb';
import { groupTypes } from '../../../../lib/wca-data.js.erb';
import useLoadedData from '../../../../lib/hooks/useLoadedData';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';

export default function GroupsManagerAdmin() {
  const {
    data: teamsCommitteesGroups,
    loading: teamsCommitteesGroupsLoading,
    error: teamsCommitteesGroupsError,
  } = useLoadedData(apiV0Urls.userGroups.list(groupTypes.teams_committees));
  const {
    data: councilsGroups,
    loading: councilsGroupsLoading,
    error: councilsGroupsError,
  } = useLoadedData(apiV0Urls.userGroups.list(groupTypes.councils));
  const groups = [...(teamsCommitteesGroups || []), ...(councilsGroups || [])];

  if (teamsCommitteesGroupsLoading || councilsGroupsLoading) {
    return <Loading />;
  }
  if (teamsCommitteesGroupsError || councilsGroupsError) {
    return <Errored />;
  }
  return <GroupsManagerForGroups groups={groups} />;
}
