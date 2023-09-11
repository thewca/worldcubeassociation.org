import React from 'react';
import { Button, Input, Table } from 'semantic-ui-react';
import UserBadge from '../UserBadge';
import { startProbationUrl, endProbationUrl } from '../../lib/requests/routes.js.erb';
import { fetchWithAuthenticityToken } from '../../lib/requests/fetchWithAuthenticityToken';

export default function DelegateProbations({ probationRoles, probationUsers }) {
  const [wcaId, setWcaId] = React.useState('');

  function startProbation() {
    fetchWithAuthenticityToken(startProbationUrl, {
      method: 'POST',
      body: JSON.stringify({ wcaId }),
      headers: { 'Content-Type': 'application/json' },
    }).then(async () => {
      window.location.reload();
    });
  }

  function endProbation(probationRoleId) {
    fetchWithAuthenticityToken(endProbationUrl, {
      method: 'POST',
      body: JSON.stringify({ probationRoleId }),
      headers: { 'Content-Type': 'application/json' },
    }).then(async () => {
      window.location.reload();
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
