import React, { useState, useEffect } from 'react';
import { Table } from 'semantic-ui-react';
import _ from 'lodash';
import useLoadedData from '../hooks/useLoadedData';
import { registerComponent } from '../wca/react-utils';
import Loading from '../requests/Loading';
import Errored from '../requests/Errored';
import './index.scss';
import EventNavigation from '../event_navigation';
import { getUrlParams, setUrlParams } from '../wca/utils';
import { competitionApiUrl, competitionEventScramblesApiUrl } from '../requests/routes.js.erb';
import I18n from '../i18n';

const RoundScramblesTable = ({ round, eventName }) => {
  const scramblesByGroupId = Object.values(_.groupBy(round.scrambles, 'groupId'));

  return (
    <>
      <h2>{I18n.t('round.name', { event_name: eventName, round_name: round.name })}</h2>
      <Table striped>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell width={1} textAlign="center">
              {I18n.t('competitions.scrambles_table.group')}
            </Table.HeaderCell>
            <Table.HeaderCell width={1}>#</Table.HeaderCell>
            <Table.HeaderCell>
              {I18n.t('competitions.scrambles_table.scramble')}
            </Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {scramblesByGroupId.map((group) => (
            group.map(({
              scrambleId, isExtra, groupId, scrambleNum, scramble,
            }) => (
              <Table.Row key={scrambleId}>
                {scrambleNum === 1 && !isExtra
                    && <Table.Cell textAlign="center" rowSpan={group.length}>{groupId}</Table.Cell>}
                <Table.Cell>
                  {isExtra ? 'Extra ' : ''}
                  {scrambleNum}
                </Table.Cell>
                <Table.Cell className="prewrap">{scramble}</Table.Cell>
              </Table.Row>
            ))
          ))}
        </Table.Body>
      </Table>
    </>
  );
};

const EventScrambles = ({ competitionId, eventId }) => {
  const { loading, error, data } = useLoadedData(
    competitionEventScramblesApiUrl(competitionId, eventId),
  );

  if (loading) return <Loading />;
  if (error) return <Errored />;
  return (
    <div className="event-scrambles">
      {data.rounds.map((round) => (
        <RoundScramblesTable key={round.id.id} round={round} eventName={data.name} />
      ))}
    </div>
  );
};

const CompetitionScrambles = ({ competitionId }) => {
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
    <div className="competition-scrambles">
      <EventNavigation
        eventIds={data.event_ids}
        selected={selectedEvent}
        onSelect={setSelectedEvent}
      />
      {selectedEvent === 'all'
        ? (
          <>
            {data.event_ids.map((eventId) => (
              <EventScrambles key={eventId} competitionId={competitionId} eventId={eventId} />))}
          </>
        )
        : (
          <EventScrambles
            competitionId={competitionId}
            eventId={selectedEvent}
          />
        )}
      <EventNavigation
        eventIds={data.event_ids}
        selected={selectedEvent}
        onSelect={setSelectedEvent}
      />
    </div>
  );
};
registerComponent(CompetitionScrambles, 'CompetitionScrambles');
