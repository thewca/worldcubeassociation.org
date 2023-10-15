import React from 'react';
import { Button, Input, Table } from 'semantic-ui-react';
import DatePicker from 'react-datepicker';
import UserBadge from '../UserBadge';
import useLoadedData from '../../lib/hooks/useLoadedData';
import {
  delegateProbationDataUrl,
  startDelegateProbationUrl,
  endDelegateProbationUrl,
} from '../../lib/requests/routes.js.erb';
import useSaveAction from '../../lib/hooks/useSaveAction';
import useInputState from '../../lib/hooks/useInputState';
import UserSearch from '../SearchWidget/UserSearch';
import Errored from '../Requests/Errored';

const dateFormat = 'YYYY-MM-DD';

function ProbationListTable({
  roleList, userMap, isActive, save, sync,
}) {
  return (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell width={5}>User</Table.HeaderCell>
          <Table.HeaderCell width={2}>Start date</Table.HeaderCell>
          <Table.HeaderCell width={2}>{isActive ? 'Action' : 'End date'}</Table.HeaderCell>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {roleList.map((probationRole) => (
          <Table.Row key={probationRole.id}>
            <Table.Cell>
              <UserBadge
                user={userMap[probationRole.user_id]}
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
                  <DatePicker
                    onChange={(date) => save(endDelegateProbationUrl, {
                      probationRoleId: probationRole.id,
                      endDate: moment(date).format(dateFormat),
                    }, sync, { method: 'POST' })}
                    selected={probationRole.end_date ? new Date(probationRole.end_date) : null}
                  />
                ) : probationRole.end_date
              }
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}

export default function DelegateProbations() {
  const [wcaId, setWcaId] = useInputState('');
  const {
    data, loading, error, sync,
  } = useLoadedData(delegateProbationDataUrl);
  const { save, saving } = useSaveAction();

  if (loading || saving) return 'Loading...'; // No i18n because this page is used only by WCA Staff.
  if (error) return <Errored />;

  const { probationRoles, probationUsers } = data;

  return (
    <>
      <h1>Delegate Probations</h1>
      <div style={{
        display: 'flex',
      }}
      >
        <UserSearch onSelect={(el) => {
          if (el.length === 1) {
            setWcaId(el[0].item.wca_id);
          } else {
            setWcaId('');
          }
        }}
        />
        <Button
          onClick={() => save(startDelegateProbationUrl, { wcaId }, sync, { method: 'POST' })}
        >
          Start Probation
        </Button>
      </div>
      <h2>Active Probations</h2>
      <ProbationListTable
        roleList={probationRoles.filter((probationRole) => probationRole.end_date === null
           || probationRole.end_date > moment().format(dateFormat))}
        userMap={probationUsers}
        isActive
        save={save}
        sync={sync}
      />
      <h2>Past Probations</h2>
      <ProbationListTable
        roleList={probationRoles.filter((probationRole) => probationRole.end_date !== null
          && probationRole.end_date <= moment().format(dateFormat))}
        userMap={probationUsers}
        isActive={false}
      />
    </>
  );
}
