import React from 'react';

import { Segment, Table } from 'semantic-ui-react';
import { events } from '../../../lib/wca-data.js.erb';

import RoundRow from './RoundRow';

export default function RoundsTable({ wcifEvent, disabled }) {
  const event = events.byId[wcifEvent.id];

  return (
    <Segment basic>
      <Table
        unstackable
        basic="very"
        textAlign="center"
        size="small"
        compact
      >
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>#</Table.HeaderCell>
            <Table.HeaderCell>Format</Table.HeaderCell>
            <Table.HeaderCell>Scramble Sets</Table.HeaderCell>
            {event.canChangeTimeLimit && (
              <Table.HeaderCell>Time Limit</Table.HeaderCell>
            )}
            {event.canHaveCutoff && <Table.HeaderCell>Cutoff</Table.HeaderCell>}
            <Table.HeaderCell>To Advance</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {wcifEvent.rounds.map((wcifRound, index) => (
            <RoundRow
              key={wcifRound.id}
              index={index}
              wcifEvent={wcifEvent}
              wcifRound={wcifRound}
              disabled={disabled}
            />
          ))}
        </Table.Body>
      </Table>
    </Segment>
  );
}
