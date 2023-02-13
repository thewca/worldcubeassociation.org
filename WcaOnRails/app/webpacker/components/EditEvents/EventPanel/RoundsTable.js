import React from 'react';

import { Segment, Table } from 'semantic-ui-react';
import { events } from '../../../lib/wca-data.js.erb';

import Round from './RoundRow';

export default function RoundsTable({ wcifEvent, disabled }) {
  const event = events.byId[wcifEvent.id];

  return (
    <Segment
      basic
      compact
      style={{
        width: '100%',
        padding: '0.5em',
        fontSize: '0.85em',
        position: 'relative',
      }}
      className="event-panel__rounds-table"
    >
      <Table
        compact
        unstackable
        basic="very"
      >
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>#</Table.HeaderCell>
            <Table.HeaderCell>Format</Table.HeaderCell>
            <Table.HeaderCell style={{ width: '5em' }}>Scramble Sets</Table.HeaderCell>
            {event.canChangeTimeLimit && (
              <Table.HeaderCell>Time Limit</Table.HeaderCell>
            )}
            {event.canHaveCutoff && <Table.HeaderCell>Cutoff</Table.HeaderCell>}
            <Table.HeaderCell>To Advance</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {wcifEvent.rounds.map((wcifRound, index) => (
            <Round
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
