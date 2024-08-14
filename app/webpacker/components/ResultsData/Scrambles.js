import React, { useState, useEffect } from 'react';
import {
  Button, Checkbox, Icon, Table,
} from 'semantic-ui-react';
import _ from 'lodash';
import useLoadedData from '../../lib/hooks/useLoadedData';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';
import '../../stylesheets/competition_scrambles.scss';
import EventNavigation from './EventNavigation';
import { getUrlParams, setUrlParams } from '../../lib/utils/wca';
import { competitionApiUrl, competitionEventScramblesApiUrl } from '../../lib/requests/routes.js.erb';
import I18n from '../../lib/i18n';

function RoundScramblesTable({ round, competitionId, adminMode }) {
  const scramblesByGroupId = Object.values(_.groupBy(round.scrambles, 'groupId'));

  return (
    <>
      <h2>{round.name}</h2>
      {adminMode && (
        <Button positive as="a" href={newScrambleUrl(competitionId, round.id)} size="tiny">
          <Icon name="plus" />
          Add a scramble to this round
        </Button>
      )}
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
}

function EventScrambles({ competitionId, eventId, adminMode }) {
  const { loading, error, data } = useLoadedData(
    competitionEventScramblesApiUrl(competitionId, eventId),
  );

  if (loading) return <Loading />;
  if (error) return <Errored />;
  return (
    <div className="event-scrambles">
      {data.rounds.map((round) => (
        <RoundScramblesTable
          key={round.id}
          round={round}
          competitionId={competitionId}
          adminMode={adminMode}
        />
      ))}
    </div>
  );
}

function CompetitionScrambles({ competitionId, canAdminResults }) {
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
    <div className="competition-scrambles">
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
              <EventScrambles key={eventId} competitionId={competitionId} eventId={eventId} />))}
          </>
        )
        : (
          <EventScrambles
            competitionId={competitionId}
            eventId={selectedEvent}
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

export default CompetitionScrambles;
