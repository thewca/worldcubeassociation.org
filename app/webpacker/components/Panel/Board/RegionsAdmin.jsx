import React from 'react';
import useLoadedData from '../../../lib/hooks/useLoadedData';
import { apiV0Urls } from '../../../lib/requests/routes.js.erb';
import { groupTypes } from '../../../lib/wca-data.js.erb';
import Loading from '../../Requests/Loading';
import Errored from '../../Requests/Errored';
import { RegionsDetailView } from '../SeniorDelegate/Regions';

export default function RegionsAdmin() {
  const {
    data: delegateRegions, loading, error,
  } = useLoadedData(apiV0Urls.userGroups.list(groupTypes.delegate_regions, 'name', { isActive: true }));

  if (loading) return <Loading />;
  if (error) return <Errored />;

  return <RegionsDetailView regions={delegateRegions} />;
}
