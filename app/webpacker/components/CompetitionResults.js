import React, { useState, useEffect } from 'react';
import {
  Button, Checkbox, Icon, Table,
} from 'semantic-ui-react';
import useLoadedData from '../lib/hooks/useLoadedData';
import Loading from './Requests/Loading';
import Errored from './Requests/Errored';
import '../stylesheets/competition_results.scss';
import EventNavigation from './EventNavigation';
import ResultRow from './CompetitionResults/ResultRow';
import ResultRowHeader from './CompetitionResults/ResultRowHeader';
import { getUrlParams, setUrlParams } from '../lib/utils/wca';
import {
  newResultUrl, competitionApiUrl, competitionEventResultsApiUrl,
} from '../lib/requests/routes.js.erb';

function RoundResultsTable({ round, competitionId, adminMode }) {
  return (
    <>
      <h2>{round.name}</h2>
      {adminMode && (
      <Button positive as="a" href={newResultUrl(competitionId, round.id)} size="tiny">
        <Icon name="plus" />
        Add a result to this round
      </Button>
      )}
      <Table striped>
        <Table.Header>
          <ResultRowHeader />
        </Table.Header>
        <Table.Body>
          {round.results.map((result, index, results) => (
            <ResultRow
              key={result.id}
              result={result}
              results={results}
              index={index}
              adminMode={adminMode}
            />
          ))}
        </Table.Body>
      </Table>
    </>
  );
}

function EventResults({ competitionId, eventId, adminMode }) {
  const { loading, error, data } = useLoadedData(
    competitionEventResultsApiUrl(competitionId, eventId),
  );

  if (loading) return <Loading />;
  if (error) return <Errored />;
  return (
    <div className="event-results">
      {data.rounds.map((round) => (
        <RoundResultsTable
          key={round.id}
          round={round}
          competitionId={competitionId}
          adminMode={adminMode}
        />
      ))}
    </div>
  );
}

function CompetitionResults({ competitionId, canAdminResults }) {
  const { loading, error, data } = useLoadedData(competitionApiUrl(competitionId));
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [adminMode, setAdminMode] = useState(false);
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
      {canAdminResults && (
        <Checkbox
          label="Enable admin mode"
          toggle
          checked={adminMode}
          onChange={(_, { checked }) => setAdminMode(checked)}
        />
      )}
      {selectedEvent === 'all'
        ? (
          <>
            {data.event_ids.map((eventId) => (
              <EventResults key={eventId} competitionId={competitionId} eventId={eventId} />))}
          </>
        )
        : (
          <EventResults
            competitionId={competitionId}
            eventId={selectedEvent}
            adminMode={adminMode}
          />
        )}
      <EventNavigation
        eventIds={data.event_ids}
        selected={selectedEvent}
        onSelect={(eventId) => setSelectedEvent(eventId)}
      />
    </div>
  );
}

export default CompetitionResults;
