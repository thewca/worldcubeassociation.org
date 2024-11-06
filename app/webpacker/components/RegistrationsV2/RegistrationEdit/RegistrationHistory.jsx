import React from 'react';
import { Header, Popup, Table } from 'semantic-ui-react';
import { getShortDateString, getShortTimeString } from '../../../lib/utils/dates';
import { events } from '../../../lib/wca-data.js.erb';
import EventIcon from '../../wca/EventIcon';

const formatHistoryColumn = (key, value) => {
  if (key === 'event_ids') {
    return events.official.flatMap((e) => (value.includes(e.id) ? <EventIcon key={e.id} id={e.id} style={{ cursor: 'unset' }} /> : []));
  }
  return value;
};

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
                      {formatHistoryColumn(k, v)}
                      {' '}
                      <br />
                    </span>
                  ),
                )}
              </Table.Cell>
              <Table.Cell>
                {
                  competitorsInfo.find(
                    (c) => c.id === Number(entry.actor_id),
                  )?.name ?? entry.actor_id
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
