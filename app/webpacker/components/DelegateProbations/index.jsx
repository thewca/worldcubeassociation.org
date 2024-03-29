import React from 'react';
import { Button, Confirm, Table } from 'semantic-ui-react';
import { DateTime } from 'luxon';
import UserBadge from '../UserBadge';
import useLoadedData from '../../lib/hooks/useLoadedData';
import { apiV0Urls } from '../../lib/requests/routes.js.erb';
import { groupTypes } from '../../lib/wca-data.js.erb';
import useSaveAction from '../../lib/hooks/useSaveAction';
import WcaSearch from '../SearchWidget/WcaSearch';
import SEARCH_MODELS from '../SearchWidget/SearchModel';
import Errored from '../Requests/Errored';
import useInputState from '../../lib/hooks/useInputState';
import UtcDatePicker from '../wca/UtcDatePicker';

function ProbationListTable({
  roleList, isActive, save, sync,
}) {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [endProbationParams, setEndProbationParams] = React.useState();

  const endProbation = () => {
    save(apiV0Urls.userRoles.update(endProbationParams.probationRoleId), {
      endDate: endProbationParams.endDate,
    }, sync, { method: 'PATCH' });

    setConfirmOpen(false);
    setEndProbationParams(null);
  };

  return (
    <>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell width={5}>User</Table.HeaderCell>
            <Table.HeaderCell width={2}>Start date</Table.HeaderCell>
            <Table.HeaderCell width={2}>End date</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {roleList.map((probationRole) => (
            <Table.Row key={probationRole.id}>
              <Table.Cell>
                <UserBadge
                  user={probationRole.user}
                  hideBorder
                  leftAlign
                />
              </Table.Cell>
              <Table.Cell>
                {probationRole.start_date}
              </Table.Cell>
              <Table.Cell>
                {
                isActive ? (
                  <UtcDatePicker
                    isoDate={probationRole.end_date}
                    onChange={(isoDate) => {
                      setEndProbationParams({
                        probationRoleId: probationRole.id,
                        endDate: isoDate,
                      });
                      setConfirmOpen(true);
                    }}
                  />
                ) : probationRole.end_date
              }
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      <Confirm
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={endProbation}
        content="Are you sure you want to change end date of this probation?"
      />
    </>
  );
}

export default function DelegateProbations() {
  const [role, setRole] = useInputState();

  const {
    data: probationRoles, loading, error, sync,
  } = useLoadedData(apiV0Urls.userRoles.listOfGroupType(groupTypes.delegate_probation));
  const { save, saving } = useSaveAction();

  if (loading || saving) return 'Loading...'; // No i18n because this page is used only by WCA Staff.
  if (error) return <Errored />;

  return (
    <>
      <h1>Delegate Probations</h1>
      <WcaSearch
        name="user"
        value={role}
        onChange={setRole}
        multiple={false}
        model={SEARCH_MODELS.userRole}
        params={{ groupType: groupTypes.delegate_regions }}
      />
      <Button
        onClick={() => save(apiV0Urls.userRoles.create(), {
          userId: role.user.id,
          groupType: groupTypes.delegate_probation,
        }, () => {
          sync();
          setRole(null);
        }, { method: 'POST' })}
        disabled={!role}
      >
        Start Probation
      </Button>
      <h2>Active Probations</h2>
      <ProbationListTable
        roleList={probationRoles.filter((probationRole) => probationRole.end_date === null
           || DateTime.fromISO(probationRole.end_date, { zone: 'UTC' }) > DateTime.now())}
        isActive
        save={save}
        sync={sync}
      />
      <h2>Past Probations</h2>
      <ProbationListTable
        roleList={probationRoles.filter((probationRole) => probationRole.end_date !== null
          && DateTime.fromISO(probationRole.end_date, { zone: 'UTC' }) <= DateTime.now())}
        isActive={false}
      />
    </>
  );
}
