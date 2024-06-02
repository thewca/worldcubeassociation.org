import React from 'react';
import useLoadedData from '../../lib/hooks/useLoadedData';
import { apiV0Urls } from '../../lib/requests/routes.js.erb';
import Errored from '../Requests/Errored';
import Loading from '../Requests/Loading';
import ActiveRoles from './ActiveRoles';
import PastRoles from './PastRoles';

const sortParams = 'groupTypeRank,status:desc';

export default function RolesTab({ userId }) {
  const {
    data: activeRoles,
    loading: activeRolesLoading,
    error: activeRolesError,
  } = useLoadedData(apiV0Urls.userRoles.list(
    { isActive: true, isGroupHidden: false, userId },
    sortParams,
  ));
  const {
    data: pastRoles,
    loading: pastRolesLoading,
    error: pastRolesError,
  } = useLoadedData(apiV0Urls.userRoles.list(
    { isActive: false, isGroupHidden: false, userId },
    sortParams,
  ));

  const hasNoRoles = activeRoles?.length === 0 && pastRoles?.length === 0;

  if (activeRolesLoading || pastRolesLoading) return <Loading />;
  if (activeRolesError || pastRolesError) return <Errored />;

  return (
    <>
      {activeRoles?.length > 0 && (<ActiveRoles activeRoles={activeRoles} />)}
      {pastRoles?.length > 0 && (<PastRoles pastRoles={pastRoles} />)}
      {hasNoRoles && <p>No Roles...</p>}
    </>
  );
}
