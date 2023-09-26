import React from 'react';
import { Button, Input, Table } from 'semantic-ui-react';
import UserBadge from '../UserBadge';
import useLoadedData from '../../lib/hooks/useLoadedData';
import {
  delegateProbationDataUrl,
  startDelegateProbationUrl,
  endDelegateProbationUrl,
} from '../../lib/requests/routes.js.erb';
import { fetchWithAuthenticityToken } from '../../lib/requests/fetchWithAuthenticityToken';

export default function DelegateProbations() {
  const [wcaId, setWcaId] = React.useState('');
  const {
    data, loading, error, sync,
  } = useLoadedData(delegateProbationDataUrl);
  if (loading) return 'Loading...';
  if (error) {
    throw error;
  }
  const { probationRoles, probationUsers } = data;

  function startProbation() {
    fetchWithAuthenticityToken(startDelegateProbationUrl, {
      method: 'POST',
      body: JSON.stringify({ wcaId }),
      headers: { 'Content-Type': 'application/json' },
    }).then(async () => {
      sync();
    });
  }

  function endProbation(probationRoleId) {
    fetchWithAuthenticityToken(endDelegateProbationUrl, {
      method: 'POST',
      body: JSON.stringify({ probationRoleId }),
      headers: { 'Content-Type': 'application/json' },
    }).then(async () => {
      sync();
    });
  }

  return (
    <>
      <h1>Delegate Probations</h1>
      <Input value={wcaId} onChange={(e) => setWcaId(e.target.value)} placeholder="Enter WCA ID" />
      <Button onClick={() => startProbation()}>Start Probation</Button>
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
                  <Button onClick={() => endProbation(probationRole.id)}>End Probation</Button>
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
