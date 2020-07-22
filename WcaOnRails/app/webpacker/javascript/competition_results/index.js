import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import { Table, Popup } from 'semantic-ui-react';
import useLoadedData from '../requests/loadable';
import { registerComponent } from '../wca/react-utils';
import Loading from '../requests/Loading';
import Errored from '../requests/Errored';
import { formatAttemptResult } from '../wca-live/attempts';

import EventIcon from '../wca/EventIcon';
import CountryFlag from '../wca/CountryFlag';
import events from '../wca/events.js.erb';
import './index.scss';

const CompetitionResultsNavigation = ({ eventIds, selected, onSelect }) => (
  <div className="events-list">
    {eventIds.map((event, index) => (
      <Popup
        key={event}
        content={events.byId[event].name}
        trigger={(
          <EventIcon
            key={event}
            id={event}
            onClick={() => onSelect(index)}
            className={classnames(selected === index && 'selected')}
          />
          )}
        inverted
      />
    ))}
  </div>
);

const RoundResultsTable = ({ round, eventName, eventId }) => (
  <>
    <h2>{`${eventName} ${round.name}`}</h2>
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>#</Table.HeaderCell>
          <Table.HeaderCell>Name</Table.HeaderCell>
          <Table.HeaderCell>Best</Table.HeaderCell>
          <Table.HeaderCell>Average</Table.HeaderCell>
          <Table.HeaderCell>Citizen Of</Table.HeaderCell>
          <Table.HeaderCell>Solves</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {round.results.map((result) => (
          <Table.Row key={result.id}>
            <Table.Cell>{result.pos}</Table.Cell>
            <Table.Cell>
              <a href={`/persons/${result.wca_id}`}>{`${result.name}`}</a>
            </Table.Cell>
            <Table.Cell>{formatAttemptResult(result.best, eventId)}</Table.Cell>
            <Table.Cell>{formatAttemptResult(result.average, eventId, true)}</Table.Cell>
            <Table.Cell><CountryFlag iso2={result.country_iso2} /></Table.Cell>
            <Table.Cell className="table-cell-solves">{result.attempts.map((a) => formatAttemptResult(a, eventId)).join(' ')}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  </>
);

const EventResults = ({ competitionId, eventId }) => {
  const { loading, error, data } = useLoadedData(
    `/api/v0/competitions/${competitionId}/results/${eventId}`,
  );

  if (loading) return <Loading />;
  if (error) return <Errored />;
  return (
    <div className="event-results">
      {data.rounds.map((round) => (
        <RoundResultsTable key={round.id} round={round} eventName={data.name} eventId={data.id} />
      ))}
    </div>
  );
};

const CompetitionResults = ({ competitionId }) => {
  const { loading, error, data } = useLoadedData(
    `/api/v0/competitions/${competitionId}/`,
  );
  const [selectedEvent, setSelectedEvent] = useState();
  const params = new URLSearchParams(window.location.search);
  useEffect(() => {
    if (data) {
      const eventParam = params.get('event');
      const index = eventParam ? data.event_ids.indexOf(eventParam) : 0;
      setSelectedEvent(index);
    }
  }, [data]);
  if (loading || selectedEvent === undefined) return <Loading />;
  if (error) return <Errored />;
  return (
    <div className="competition-results">
      <CompetitionResultsNavigation
        eventIds={data.event_ids}
        selected={selectedEvent}
        onSelect={(eventIndex) => setSelectedEvent(eventIndex)}
      />
      <EventResults
        competitionId={competitionId}
        eventId={data.event_ids[selectedEvent]}
      />
    </div>
  );
};
registerComponent(CompetitionResults, 'CompetitionResults');
