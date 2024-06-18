import React from 'react';
import { Header, Popup, Table } from 'semantic-ui-react';
import { getShortDateString, getShortTimeString } from '../../../lib/utils/dates';

export default function RegistrationHistory({ history, competitorsInfo }) {
  return (
    <>
      <Header>Registration History</Header>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Timestamp</Table.HeaderCell>
            <Table.HeaderCell>Changes</Table.HeaderCell>
            <Table.HeaderCell>Acting User</Table.HeaderCell>
            <Table.HeaderCell>Action</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {history.map((entry) => (
            <Table.Row key={entry.timestamp}>
              <Table.Cell>
                <Popup
                  content={getShortTimeString(entry.timestamp)}
                  trigger={
                    <span>{getShortDateString(entry.timestamp)}</span>
                  }
                />
              </Table.Cell>
              <Table.Cell>
                {Object.entries(entry.changed_attributes).map(
                  ([k, v]) => (
                    <span key={k}>
                      Changed
                      {' '}
                      {k}
                      {' '}
                      to
                      {' '}
                      {JSON.stringify(v)}
                      {' '}
                      <br />
                    </span>
                  ),
                )}
              </Table.Cell>
              <Table.Cell>
                {
                  competitorsInfo.find(
                    (c) => c.id === entry.actor_id,
                  )?.name ?? entry.actor_user_id
                }
              </Table.Cell>
              <Table.Cell>{entry.action}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </>
  );
}
