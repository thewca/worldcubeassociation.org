import React, { useState, useEffect } from 'react';
import { Table } from 'semantic-ui-react';
import cn from 'classnames';
import useLoadedData from '../lib/hooks/useLoadedData';
import { registerComponent } from '../lib/utils/react';
import Loading from './Requests/Loading';
import Errored from './Requests/Errored';
import {
  formatAttemptResult,
  formatAttemptsForResult,
} from '../lib/wca-live/attempts';
import CountryFlag from './wca/CountryFlag';
import '../stylesheets/competition_results.scss';
import EventNavigation from './EventNavigation';
import { getUrlParams, setUrlParams } from '../lib/utils/wca';
import { personUrl, competitionApiUrl, competitionEventResultsApiUrl } from '../lib/requests/routes.js.erb';
import I18n from '../lib/i18n';

const getRecordClass = (record) => {
  switch (record) {
    case null:
      return '';
    case 'WR': // Intentional fallthrough
    case 'NR':
      return record;
    default:
      return 'CR';
  }
};

const RoundResultsTable = ({ round, eventName, eventId }) => (
  <>
    <h2>{`${eventName} ${round.name}`}</h2>
    <Table striped>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell width={1}>#</Table.HeaderCell>
          <Table.HeaderCell width={4}>
            {I18n.t('competitions.results_table.name')}
          </Table.HeaderCell>
          <Table.HeaderCell>{I18n.t('common.best')}</Table.HeaderCell>
          <Table.HeaderCell />
          <Table.HeaderCell>{I18n.t('common.average')}</Table.HeaderCell>
          <Table.HeaderCell />
          <Table.HeaderCell>{I18n.t('common.user.citizen_of')}</Table.HeaderCell>
          <Table.HeaderCell>{I18n.t('common.solves')}</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {round.results.map((result, index, results) => (
          <Table.Row key={result.id}>
            <Table.Cell className={cn({ 'text-muted': index > 0 && results[index - 1].pos === result.pos })}>
              {result.pos}
            </Table.Cell>
            <Table.Cell>
              <a href={personUrl(result.wca_id)}>{`${result.name}`}</a>
            </Table.Cell>
            <Table.Cell className={getRecordClass(result.regional_single_record)}>
              {formatAttemptResult(result.best, eventId)}
            </Table.Cell>
            <Table.Cell>{result.regional_single_record}</Table.Cell>
            <Table.Cell className={getRecordClass(result.regional_average_record)}>
              {formatAttemptResult(result.average, eventId)}
            </Table.Cell>
            <Table.Cell>{result.regional_average_record}</Table.Cell>
            <Table.Cell><CountryFlag iso2={result.country_iso2} /></Table.Cell>
            <Table.Cell className={(eventId === '333mbf' || eventId === '333mbo') ? 'table-cell-solves-mbf' : 'table-cell-solves'}>
              {formatAttemptsForResult(result, eventId)}
            </Table.Cell>
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
          />
        )}
      <EventNavigation
        eventIds={data.event_ids}
        selected={selectedEvent}
        onSelect={(eventId) => setSelectedEvent(eventId)}
      />
    </div>
  );
};
registerComponent(CompetitionResults, 'CompetitionResults');
