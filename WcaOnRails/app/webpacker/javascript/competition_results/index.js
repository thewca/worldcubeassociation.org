import React, { useState, useEffect } from 'react';
import { Table } from 'semantic-ui-react';
import useLoadedData from '../requests/useLoadedData';
import { registerComponent } from '../wca/react-utils';
import Loading from '../requests/Loading';
import Errored from '../requests/Errored';
import { formatAttemptResult } from '../wca-live/attempts';
import CountryFlag from '../wca/CountryFlag';
import './index.scss';
import EventNavigation from '../event_navigation';
import { getUrlParams, setUrlParams } from '../wca/utils';
import { personUrl, competitionApiUrl, competitionEventResultsApiUrl } from '../requests/routes.js.erb';

const RoundResultsTable = ({ round, eventName, eventId }) => (
  <>
    <h2>{`${eventName} ${round.name}`}</h2>
    <Table striped>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell width={1}>#</Table.HeaderCell>
          <Table.HeaderCell width={4}>Name</Table.HeaderCell>
          <Table.HeaderCell width={2}>Best</Table.HeaderCell>
          <Table.HeaderCell width={2}>Average</Table.HeaderCell>
          <Table.HeaderCell>Citizen Of</Table.HeaderCell>
          <Table.HeaderCell>Solves</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {round.results.map((result) => (
          <Table.Row key={result.id}>
            <Table.Cell>{result.pos}</Table.Cell>
            <Table.Cell>
              <a href={personUrl(result.wca_id)}>{`${result.name}`}</a>
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
    competitionEventResultsApiUrl(competitionId, eventId),
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
  const { loading, error, data } = useLoadedData(competitionApiUrl(competitionId));
  const [selectedEvent, setSelectedEvent] = useState(null);
  useEffect(() => {
    if (data) {
      const params = getUrlParams();
      const event = params.event || data.event_ids[0];
      setSelectedEvent(event);
    }
  }, [data]);
  useEffect(() => {
    if (selectedEvent) {
      setUrlParams({ event: selectedEvent });
    }
  }, [selectedEvent]);
  if (loading || !selectedEvent) return <Loading />;
  if (error) return <Errored />;
  return (
    <div className="competition-results">
      <EventNavigation
        eventIds={data.event_ids}
        selected={selectedEvent}
        onSelect={(eventId) => setSelectedEvent(eventId)}
      />
      <EventResults
        competitionId={competitionId}
        eventId={selectedEvent}
      />
      <EventNavigation
        eventIds={data.event_ids}
        selected={selectedEvent}
        onSelect={(eventId) => setSelectedEvent(eventId)}
      />
    </div>
  );
};
registerComponent(CompetitionResults, 'CompetitionResults');
