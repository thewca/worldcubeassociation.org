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
    data: probationRoles, loading, error, sync,
  } = useLoadedData(apiV0Urls.userRoles.list({ groupType: groupTypes.delegate_probation }));
  const { save, saving } = useSaveAction();
  const { loggedInUserPermissions } = useLoggedInUserPermissions();

  if (loading || saving) return <Loading />;
  if (error) return <Errored />;

  const now = DateTime.now();

  const activeRoles = probationRoles.filter(
    (r) => !r.end_date || DateTime.fromISO(r.end_date, { zone: 'UTC' }) > now,
  );
  const pastRoles = probationRoles.filter(
    (r) => r.end_date && DateTime.fromISO(r.end_date, { zone: 'UTC' }) <= now,
  );

  const canEditProbation = probationRoles
    .some((probationRole) => loggedInUserPermissions.canEditGroup(probationRole.group.id));

  return (
    <>
      <h1>Delegate Probations</h1>
      {canEditProbation && <ProbationForm save={save} sync={sync} />}

      <h2>Active Probations</h2>
      <ProbationListTable
        roleList={activeRoles}
        isActive={canEditProbation}
        save={save}
        sync={sync}
      />

      <h2>Past Probations</h2>
      <ProbationListTable
        roleList={pastRoles}
        isActive={false}
      />
    </>
  );
}
