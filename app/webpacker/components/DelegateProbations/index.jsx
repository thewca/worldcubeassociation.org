import React from 'react';
import { DateTime } from 'luxon';
import useLoadedData from '../../lib/hooks/useLoadedData';
import useSaveAction from '../../lib/hooks/useSaveAction';
import { apiV0Urls } from '../../lib/requests/routes.js.erb';
import { groupTypes } from '../../lib/wca-data.js.erb';
import Errored from '../Requests/Errored';
import Loading from '../Requests/Loading';

import ProbationForm from './ProbationForm';
import ProbationListTable from './ProbationListTable';
import useLoggedInUserPermissions from '../../lib/hooks/useLoggedInUserPermissions';

export default function DelegateProbations() {
  const {
    data: probationRoles, loading: rolesLoading, error: rolesError, sync: rolesSync,
  } = useLoadedData(apiV0Urls.userRoles.list({ groupType: groupTypes.delegate_probation }));
  const {
    data: probationGroups,
    loading: probationGroupLoading,
    error: probationGroupError,
  } = useLoadedData(apiV0Urls.userGroups.list(groupTypes.delegate_probation));
  const { save, saving } = useSaveAction();
  const { loggedInUserPermissions, loading: permissionsLoading } = useLoggedInUserPermissions();

  if (rolesLoading || saving || probationGroupLoading || permissionsLoading) return <Loading />;
  if (rolesError || probationGroupError) return <Errored />;

  const now = DateTime.now();

  const activeRoles = probationRoles.filter(
    (r) => !r.end_date || DateTime.fromISO(r.end_date, { zone: 'UTC' }) > now,
  );
  const pastRoles = probationRoles.filter(
    (r) => r.end_date && DateTime.fromISO(r.end_date, { zone: 'UTC' }) <= now,
  );

  const canEditProbation = probationGroups
    .some((probationGroup) => loggedInUserPermissions.canEditGroup(probationGroup.id));

  return (
    <>
      <h1>Delegate Probations</h1>
      {canEditProbation && <ProbationForm save={save} sync={rolesSync} />}

      <h2>Active Probations</h2>
      <ProbationListTable
        roleList={activeRoles}
        isActive={canEditProbation}
        save={save}
        sync={rolesSync}
      />

      <h2>Past Probations</h2>
      <ProbationListTable
        roleList={pastRoles}
        isActive={false}
      />
    </>
  );
}
