import React from 'react';
import {
  Header,
  Icon, Popup, PopupContent, PopupHeader,
  Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow,
} from 'semantic-ui-react';
import I18nHTMLTranslate from '../../I18nHTMLTranslate';
import I18n from '../../../lib/i18n';
import { events } from '../../../lib/wca-data.js.erb';
import EventIcon from '../../wca/EventIcon';
import { rankingsPath } from '../../../lib/requests/routes.js.erb';
import {formatAttemptResult} from "../../../lib/wca-live/attempts";

function isOddRank(rank) {
  if (rank === undefined) {
    return false;
  }

  // NOTE: world rank is always present.
  const anyMissing = rank.continentRank === 0 || rank.countryRank === 0;

  return anyMissing || rank.continentRank < rank.countryRank;
}

function RankHeader({ type, short }) {
  return (
    <TableHeaderCell>
      <abbr title={I18n.t(`competitions.results_table.rank.${type}`)}>
        {short}
      </abbr>
    </TableHeaderCell>
  );
}

function RankCell({ ranks, type }) {
  if (!ranks) return <TableCell />;

  const rank = ranks[`${type}Rank`];
  if (!rank) return <TableCell />;

  const opacity = rank === 1 ? 1 : {
    country: 0.6,
    continent: 0.8,
    world: 1,
  }[type];

  const color = rank === 1 ? 'red' : undefined;

  return (
    <TableCell>
      <span
        style={{
          opacity,
          color,
        }}
      >
        {rank === 0 ? '-' : rank}
      </span>
    </TableCell>
  );
}

function ResultPopup({
  results, rankForEvent, average, eventId, competitions,
}) {
  const matchingResult = results.reverse().find((r) => {
    if (r.eventId !== eventId) return false;
    if (average) return r.average === rankForEvent.time;
    return r.best === rankForEvent.time;
  });

  const resultType = average ? 'average' : 'single';

  if (!matchingResult) {
    return (
      <a href={rankingsPath(eventId, resultType)} className="plain">
        {formatAttemptResult(rankForEvent.time, eventId)}
      </a>
    );
  }

  const competition = competitions[matchingResult.competition_id];

  return (
    <Popup
      trigger={(
        <a href={rankingsPath(eventId, resultType)} className="plain">
          <b>{formatAttemptResult(rankForEvent.time, eventId)}</b>
        </a>
      )}
    >
      <PopupHeader><I18nHTMLTranslate i18nKey={`events.${eventId}`} /></PopupHeader>
      <PopupContent>
        <Header as="h2">
          {formatAttemptResult(rankForEvent.time, eventId)}
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
      </PopupContent>
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
    <TableRow key={eventId}>
      <TableCell>
        <EventIcon id={eventId} />
        <I18nHTMLTranslate i18nKey={`events.${eventId}`} />
      </TableCell>
      <RankCell ranks={singleForEvent} type="country" />
      <RankCell ranks={singleForEvent} type="continent" />
      <RankCell ranks={singleForEvent} type="world" />
      <TableCell textAlign="right">
        {singleForEvent && (
          <ResultPopup
            results={results}
            rankForEvent={singleForEvent}
            eventId={eventId}
            competitions={competitions}
          />
        )}
      </TableCell>
      <TableCell textAlign="left">
        {averageForEvent && (
          <ResultPopup
            results={results}
            rankForEvent={averageForEvent}
            eventId={eventId}
            competitions={competitions}
            average
          />
        )}
      </TableCell>
      <RankCell ranks={averageForEvent} type="world" />
      <RankCell ranks={averageForEvent} type="continent" />
      <RankCell ranks={averageForEvent} type="country" />
      {anyOddRank && (
        <TableCell>
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
        </TableCell>
      )}
    </TableRow>
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
          <TableHeader>
            <TableRow>
              <TableHeaderCell>
                <I18nHTMLTranslate i18nKey="competitions.results_table.event" />
              </TableHeaderCell>
              <RankHeader type="national" short="NR" />
              <RankHeader type="continent" short="CR" />
              <RankHeader type="world" short="WR" />
              <TableHeaderCell collapsing textAlign="right">
                {I18n.t('common.single')}
              </TableHeaderCell>
              <TableHeaderCell>
                {I18n.t('common.average')}
              </TableHeaderCell>
              <RankHeader type="world" short="WR" />
              <RankHeader type="continent" short="CR" />
              <RankHeader type="national" short="NR" />
              {anyOddRank && (<TableHeaderCell />)}
            </TableRow>
          </TableHeader>
          <TableBody>
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
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
