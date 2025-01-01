import React, { useMemo, useState } from 'react';
import {
  Table, TableBody, TableHeader,
} from 'semantic-ui-react';
import _ from 'lodash';
import { events, roundTypes } from '../../../lib/wca-data.js.erb';
import { EventSelector } from '../../CompetitionsOverview/CompetitionsFilters';
import { competitionUrl } from '../../../lib/requests/routes.js.erb';

export default function Results({
  person,
}) {
  const personEvents = new Set(person.results.map((r) => r.eventId));
  const eventList = events.official.filter((r) => personEvents.has(r.id)).map((r) => r.id);
  const [currentEvent, setCurrentEvent] = useState(eventList[0]);
  const currentResults = useMemo(
    () => person.results.filter((r) => r.eventId === currentEvent),
    [currentEvent, person.results],
  );

  return (
    <>
      <EventSelector
        showLabels={false}
        selectedEvents={currentEvent}
        onEventSelection={({ eventId }) => setCurrentEvent(eventId)}
        eventList={eventList}
      />
      <Table striped compact>
        <TableHeader>
          <Table.HeaderCell>
            Competition
          </Table.HeaderCell>
          <Table.HeaderCell>
            Round
          </Table.HeaderCell>
          <Table.HeaderCell>
            Place
          </Table.HeaderCell>
          <Table.HeaderCell>
            Single
          </Table.HeaderCell>
          <Table.HeaderCell>
            Average
          </Table.HeaderCell>
          <Table.HeaderCell>
            Solves
          </Table.HeaderCell>
        </TableHeader>
        <TableBody>
          {_.map(_.groupBy(currentResults, 'competition.id'), ((c) => c.map((r, index) => (
            <Table.Row key={r.id}>
              <Table.Cell>
                {index === 0 && <a href={competitionUrl(r.competition.id)}>{r.competition.name}</a>}
              </Table.Cell>
              <Table.Cell>{roundTypes.byId[r.roundTypeId].name}</Table.Cell>
              <Table.Cell>{r.pos}</Table.Cell>
              <Table.Cell>{r.best}</Table.Cell>
              <Table.Cell>{r.average}</Table.Cell>
              <Table.Cell>
                {r.attempts.map((a, i) => {
                  if (i === r.bestIdx || i === r.worstIdx) {
                    return `(${a})`;
                  }
                  return a;
                }).join(' ')}
              </Table.Cell>
            </Table.Row>
          ))))}
        </TableBody>
      </Table>
    </>
  );
}
