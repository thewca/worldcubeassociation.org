import React from 'react';
import {
  Header, Icon, Popup, Table,
} from 'semantic-ui-react';
import I18nHTMLTranslate from '../../I18nHTMLTranslate';
import I18n from '../../../lib/i18n';
import { events } from '../../../lib/wca-data.js.erb';
import EventIcon from '../../wca/EventIcon';
import { rankingsPath } from '../../../lib/requests/routes.js.erb';
import { formatAttemptResult } from '../../../lib/wca-live/attempts';

function isOddRank(rank) {
  if (rank === undefined) {
    return false;
  }

  // NOTE: world rank is always present.
  const anyMissing = rank.continentalRanking === 0 || rank.nationalRanking === 0;

  return anyMissing || rank.continentalRanking < rank.nationalRanking;
}

function RankHeader({ type, short }) {
  return (
    <Table.HeaderCell>
      <abbr title={I18n.t(`competitions.results_table.rank.${type}`)}>
        {short}
      </abbr>
    </Table.HeaderCell>
  );
}

function RankCell({ ranks, type }) {
  if (!ranks) return <Table.Cell />;

  const rank = ranks[`${type}Ranking`];
  if (!rank) return <Table.Cell />;

  const opacity = rank === 1 ? 1 : {
    country: 0.6,
    continent: 0.8,
    world: 1,
  }[type];

  const color = rank === 1 ? 'red' : undefined;

  return (
    <Table.Cell>
      <span
        style={{
          opacity,
          color,
        }}
      >
        {rank === 0 ? '-' : rank}
      </span>
    </Table.Cell>
  );
}

function ResultPopup({
  results, rankForEvent, average, eventId, competitions,
}) {
  const matchingResult = results.reverse().find((r) => {
    if (r.event_id !== eventId) return false;
    if (average) return r.average === rankForEvent.best;
    return r.best === rankForEvent.best;
  });

  const resultType = average ? 'average' : 'single';

  if (!matchingResult) {
    return (
      <a href={rankingsPath(eventId, resultType)} className="plain">
        {formatAttemptResult(rankForEvent.best, eventId)}
      </a>
    );
  }

  const competition = competitions[matchingResult.competition_id];

  return (
    <Popup
      trigger={(
        <a href={rankingsPath(eventId, resultType)} className="plain">
          <b>{formatAttemptResult(rankForEvent.best, eventId)}</b>
        </a>
      )}
    >
      <Popup.Header><I18nHTMLTranslate i18nKey={`events.${eventId}`} /></Popup.Header>
      <Popup.Content>
        <Header as="h2">
          {formatAttemptResult(rankForEvent.best, eventId)}
          {' '}
          <I18nHTMLTranslate i18nKey={average ? 'common.average' : 'common.single'} />
        </Header>
        <p>
          <EventIcon id={eventId} style={{ fontSize: 'medium' }} />
          {' '}
          {competition.name}
        </p>
        <p>
          {competition.date_range}
        </p>
      </Popup.Content>
    </Popup>
  );
}

function EventRanks({
  results, singles, averages, competitions, eventId, anyOddRank,
}) {
  const singleForEvent = singles.find((r) => r.eventId === eventId);
  const averageForEvent = averages.find((r) => r.eventId === eventId);
  if (!singleForEvent && !averageForEvent) return null;

  const oddRank = isOddRank(singleForEvent) || isOddRank(averageForEvent);

  return (
    <Table.Row key={eventId}>
      <Table.Cell>
        <EventIcon id={eventId} />
        <I18nHTMLTranslate i18nKey={`events.${eventId}`} />
      </Table.Cell>
      <RankCell ranks={singleForEvent} type="national" />
      <RankCell ranks={singleForEvent} type="continental" />
      <RankCell ranks={singleForEvent} type="world" />
      <Table.Cell textAlign="right">
        {singleForEvent && (
          <ResultPopup
            results={results}
            rankForEvent={singleForEvent}
            eventId={eventId}
            competitions={competitions}
          />
        )}
      </Table.Cell>
      <Table.Cell textAlign="left">
        {averageForEvent && (
          <ResultPopup
            results={results}
            rankForEvent={averageForEvent}
            eventId={eventId}
            competitions={competitions}
            average
          />
        )}
      </Table.Cell>
      <RankCell ranks={averageForEvent} type="world" />
      <RankCell ranks={averageForEvent} type="continental" />
      <RankCell ranks={averageForEvent} type="national" />
      {anyOddRank && (
        <Table.Cell>
          {oddRank && (
            <Popup
              content={I18n.t('persons.show.odd_rank_reason')}
              trigger={(
                <Icon
                  name="question circle"
                />
              )}
            />
          )}
        </Table.Cell>
      )}
    </Table.Row>
  );
}

export default function PersonalRecords({
  results, averageRanks, singleRanks, competitions,
}) {
  const anyOddRank = singleRanks.some((r) => isOddRank(r))
    || averageRanks.some((r) => isOddRank(r));

  return (
    <div>
      <Header as="h3" textAlign="center">
        {I18n.t('persons.show.personal_records')}
      </Header>
      <div style={{ overflowX: 'auto' }}>
        <Table striped unstackable basic="very" compact="very" singleLine>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>
                <I18nHTMLTranslate i18nKey="competitions.results_table.event" />
              </Table.HeaderCell>
              <RankHeader type="national" short="NR" />
              <RankHeader type="continent" short="CR" />
              <RankHeader type="world" short="WR" />
              <Table.HeaderCell collapsing textAlign="right">
                {I18n.t('common.single')}
              </Table.HeaderCell>
              <Table.HeaderCell>
                {I18n.t('common.average')}
              </Table.HeaderCell>
              <RankHeader type="world" short="WR" />
              <RankHeader type="continent" short="CR" />
              <RankHeader type="national" short="NR" />
              {anyOddRank && (<Table.HeaderCell />)}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {events.official.map((event) => (
              <EventRanks
                results={results}
                key={event.id}
                eventId={event.id}
                averages={averageRanks}
                singles={singleRanks}
                competitions={competitions}
                anyOddRank={anyOddRank}
              />
            ))}
          </Table.Body>
        </Table>
      </div>
    </div>
  );
}
