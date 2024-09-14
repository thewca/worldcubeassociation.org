import React, { useState, useEffect } from 'react';
import {
  Button, Checkbox, Icon, Table,
} from 'semantic-ui-react';
import useLoadedData from '../../lib/hooks/useLoadedData';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';
import '../../stylesheets/competition_results.scss';
import EventNavigation from './EventNavigation';
import { getUrlParams, setUrlParams } from '../../lib/utils/wca';
import { competitionApiUrl } from '../../lib/requests/routes.js.erb';

function RoundResultsTable({
  competitionId,
  round,
  newEntryUrlFn,
  DataRowHeader,
  DataRowBody,
  adminMode,
}) {
  return (
    <>
      <h2>{round.name}</h2>
      {adminMode && (
        <Button positive as="a" href={newEntryUrlFn(competitionId, round.id)} size="tiny">
          <Icon name="plus" />
          Add an entry to this round
        </Button>
      )}
      <Table striped>
        <Table.Header>
          <DataRowHeader />
        </Table.Header>
        <Table.Body>
          <DataRowBody round={round} adminMode={adminMode} />
        </Table.Body>
      </Table>
    </>
  );
}

function ResultsView({
  competitionId,
  eventId,
  dataUrlFn,
  newEntryUrlFn,
  DataRowHeader,
  DataRowBody,
  adminMode,
}) {
  const { loading, error, data } = useLoadedData(
    dataUrlFn(competitionId, eventId),
  );

  if (loading) return <Loading />;
  if (error) return <Errored />;

  return (
    <div className="results-data">
      {data.rounds.map((round) => (
        <RoundResultsTable
          key={round.id}
          competitionId={competitionId}
          round={round}
          newEntryUrlFn={newEntryUrlFn}
          DataRowHeader={DataRowHeader}
          DataRowBody={DataRowBody}
          adminMode={adminMode}
        />
      ))}
    </div>
  );
}

function ViewData({
  competitionId,
  canAdminResults,
  dataUrlFn,
  newEntryUrlFn,
  DataRowHeader,
  DataRowBody,
}) {
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
        onSelect={setSelectedEvent}
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
              <ResultsView
                key={eventId}
                competitionId={competitionId}
                eventId={eventId}
                dataUrlFn={dataUrlFn}
                newEntryUrlFn={newEntryUrlFn}
                DataRowHeader={DataRowHeader}
                DataRowBody={DataRowBody}
                adminMode={false}
              />
            ))}
          </>
        )
        : (
          <ResultsView
            competitionId={competitionId}
            eventId={selectedEvent}
            dataUrlFn={dataUrlFn}
            newEntryUrlFn={newEntryUrlFn}
            DataRowHeader={DataRowHeader}
            DataRowBody={DataRowBody}
            adminMode={adminMode}
          />
        )}
      <EventNavigation
        eventIds={data.event_ids}
        selected={selectedEvent}
        onSelect={setSelectedEvent}
      />
    </div>
  );
}

export default ViewData;
