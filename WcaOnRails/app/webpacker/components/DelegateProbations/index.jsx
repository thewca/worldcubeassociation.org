import React from 'react';
import { Button, Input, Table } from 'semantic-ui-react';
import UserBadge from '../UserBadge';
import useLoadedData from '../../lib/hooks/useLoadedData';
import {
  delegateProbationDataUrl,
  startDelegateProbationUrl,
  endDelegateProbationUrl,
} from '../../lib/requests/routes.js.erb';
import { post } from '../../lib/requests/fetchWithAuthenticityToken';

export default function DelegateProbations() {
  const [wcaId, setWcaId] = React.useState('');
  const {
    data, loading, error, sync,
  } = useLoadedData(delegateProbationDataUrl);

  if (loading) return 'Loading...'; // No i18n because this page is used only by WCA Staff.
  if (error) throw error;

  const { probationRoles, probationUsers } = data;

  return (
    <>
      <h1>Delegate Probations</h1>
      <Input value={wcaId} onChange={(e) => setWcaId(e.target.value)} placeholder="Enter WCA ID" />
      <Button
        onClick={() => post(startDelegateProbationUrl, { wcaId }).then(sync)}
      >
        Start Probation
      </Button>
      <h2>Active Probations</h2>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell width={5}>User</Table.HeaderCell>
            <Table.HeaderCell width={2}>Start date</Table.HeaderCell>
            <Table.HeaderCell width={2}>Action</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {probationRoles
            .filter((probationRole) => probationRole.end_date === null)
            .map((probationRole) => (
              <Table.Row key={probationRole.id}>
                <Table.Cell>
                  <UserBadge
                    user={probationUsers[probationRole.user_id]}
                    hideBorder
                    leftAlign
                  />
                </Table.Cell>
                <Table.Cell>
                  {probationRole.start_date}
                </Table.Cell>
                <Table.Cell>
                  <Button
                    onClick={() => post(endDelegateProbationUrl, {
                      probationRoleId: probationRole.id,
                    }).then(sync)}
                  >
                    End Probation
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))}
        </Table.Body>
      </Table>
      <h2>Past Probations</h2>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell width={5}>User</Table.HeaderCell>
            <Table.HeaderCell width={2}>Start date</Table.HeaderCell>
            <Table.HeaderCell width={2}>End date</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {probationRoles
            .filter((probationRole) => probationRole.end_date !== null)
            .map((probationRole) => (
              <Table.Row key={probationRole.id}>
                <Table.Cell>
                  <UserBadge
                    user={probationUsers[probationRole.user_id]}
                    hideBorder
                    leftAlign
                  />
                </Table.Cell>
                <Table.Cell>
                  {probationRole.start_date}
                </Table.Cell>
                <Table.Cell>
                  {probationRole.end_date}
                </Table.Cell>
              </Table.Row>
            ))}
        </Table.Body>
      </Table>
    </>
  );
}
