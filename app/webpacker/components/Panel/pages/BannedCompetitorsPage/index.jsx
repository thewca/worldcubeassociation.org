import React from 'react';
import useLoadedData from '../../../../lib/hooks/useLoadedData';
import { apiV0Urls } from '../../../../lib/requests/routes.js.erb';
import { groupTypes } from '../../../../lib/wca-data.js.erb';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';
import BannedCompetitors from './BannedCompetitors';

export default function BannedCompetitorsPage() {
  const {
    data: bannedCompetitorRoles, loading, error, sync,
  } = useLoadedData(apiV0Urls.userRoles.listOfGroupType(groupTypes.banned_competitors));

  if (loading) return <Loading />;
  if (error) return <Errored />;

  return <BannedCompetitors bannedCompetitorRoles={bannedCompetitorRoles} sync={sync} />;
}
