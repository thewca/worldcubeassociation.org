import React, { useMemo, useState } from 'react';
import { Divider, Table } from 'semantic-ui-react';
import _ from 'lodash';
import { events, roundTypes } from '../../../lib/wca-data.js.erb';
import { EventSelector } from '../../wca/EventSelector';
import { competitionUrl } from '../../../lib/requests/routes.js.erb';
import I18n from '../../../lib/i18n';
import { formatAttemptResult } from '../../../lib/wca-live/attempts';

const colorForResult = (regionalRecord, pbMarker) => {
  let recordColor = { };
  if (pbMarker) {
    recordColor = { color: '#fc4a0a' };
  }
  if (regionalRecord) {
    switch (regionalRecord) {
      case 'WR': {
        recordColor = { color: '#0366d6' };
        break;
      }
      case 'NR': {
        recordColor = { color: '#28a745' };
        break;
      }
      default: {
        recordColor = { color: '#d00404' };
      }
    }
  }
  return recordColor;
};

export default function Results({
  results,
  competitions,
  pbMarkers,
  highlightPosition,
}) {
  const personEvents = new Set(results.map((r) => r.event_id));
  const eventList = events.official.filter((r) => personEvents.has(r.id)).map((r) => r.id);
  const [currentEvent, setCurrentEvent] = useState(new URL(document.location.toString()).searchParams.get('event') ?? eventList[0]);
  const currentResults = useMemo(
    () => results.filter((r) => r.event_id === currentEvent),
    [currentEvent, results],
  );

  const currentResultsPbs = useMemo(
    () => pbMarkers[currentEvent],
    [pbMarkers, currentEvent],
  );

  return (
    <>
      <EventSelector
        showLabels={false}
        selectedEvents={[currentEvent]}
        onEventSelection={({ eventId }) => {
          setCurrentEvent(eventId);
          const url = new URL(window.location.href);
          url.searchParams.set('event', eventId);
          window.history.pushState({}, '', url);
        }}
        eventList={eventList}
      />
      <Divider />
      <div style={{ overflowX: 'auto' }}>
        <Table unstackable compact="very" singleLine basic="very" striped>
          <Table.Header>
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
              {I18n.t('common.best')}
            </Table.HeaderCell>
            <Table.HeaderCell />
            <Table.HeaderCell>
              {I18n.t('common.average')}
            </Table.HeaderCell>
            <Table.HeaderCell />
            <Table.HeaderCell />
            <Table.HeaderCell />
            <Table.HeaderCell>
              Solves
            </Table.HeaderCell>
            <Table.HeaderCell />
            <Table.HeaderCell />
          </Table.Header>
          <Table.Body>
            {_.map(_.groupBy(currentResults, 'competition_id'), ((c) => c.map((r, index) => (
              <Table.Row key={r.id} positive={highlightPosition === r.pos && r.round_type_id === 'f'}>
                <Table.Cell>
                  {index === 0 && <a href={competitionUrl(r.competition_id)}>{competitions[r.competition_id].name}</a>}
                </Table.Cell>
                <Table.Cell>{roundTypes.byId[r.round_type_id].name}</Table.Cell>
                <Table.Cell>{r.pos}</Table.Cell>
                <Table.Cell style={colorForResult(r.regional_single_record, currentResultsPbs[r.id]?.single)}>
                  {formatAttemptResult(r.best, r.event_id)}
                </Table.Cell>
                <Table.Cell><b>{r.regional_single_record}</b></Table.Cell>
                <Table.Cell style={colorForResult(r.regional_average_record, currentResultsPbs[r.id]?.average)}>
                  {formatAttemptResult(r.average, r.event_id)}
                </Table.Cell>
                <Table.Cell><b>{r.regional_average_record}</b></Table.Cell>
                {r.attempts.map((a, i) => {
                  const attemptClock = formatAttemptResult(a, r.event_id);

                  if (i === r.best_index || i === r.worst_index) {
                    return (
                      <Table.Cell>
                        (
                        {attemptClock}
                        )
                      </Table.Cell>
                    );
                  }
                  return <Table.Cell>{attemptClock}</Table.Cell>;
                })}
              </Table.Row>
            ))))}
          </Table.Body>
        </Table>
      </div>
    </>
  );
}
