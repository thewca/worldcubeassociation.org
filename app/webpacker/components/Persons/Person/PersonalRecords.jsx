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
  person, resultForEvent, average, eventId,
}) {
  const matchingResult = person.results.reverse().find((r) => {
    if (r.eventId !== eventId) return false;
    if (average) return r.average === resultForEvent.time;
    return r.best === resultForEvent.time;
  });

  if (!matchingResult) {
    return (
      <a href={resultForEvent.rankPath} className="plain">
        {resultForEvent.time}
      </a>
    );
  }

  return (
    <Popup
      trigger={(
        <a href={resultForEvent.rankPath} className="plain">
          <b>{resultForEvent.time}</b>
        </a>
      )}
    >
      <PopupHeader><I18nHTMLTranslate i18nKey={`events.${eventId}`} /></PopupHeader>
      <PopupContent>
        <Header as="h2">
          {resultForEvent.time}
          {' '}
          <I18nHTMLTranslate i18nKey={average ? 'common.average' : 'common.single'} />
        </Header>
        <p>
          <EventIcon id={eventId} style={{ fontSize: 'medium' }} />
          {' '}
          {matchingResult.competition.name}
        </p>
        <p>
          {matchingResult.competition.markerDate}
        </p>
      </PopupContent>
    </Popup>
  );
}

function EventRanks({
  person, singles, averages, eventId, anyOddRank,
}) {
  const singleForEvent = singles.find((r) => r.eventId === eventId);
  const averageForEvent = averages.find((r) => r.eventId === eventId);
  if (!singleForEvent && !averageForEvent) return null;

  const oddRank = singleForEvent.oddRank || averageForEvent?.oddRank;

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
          <ResultPopup person={person} resultForEvent={singleForEvent} eventId={eventId} />
        )}
      </TableCell>
      <TableCell textAlign="left">
        {averageForEvent && (
          <ResultPopup person={person} resultForEvent={averageForEvent} eventId={eventId} average />
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

export default function PersonalRecords({ person, averageRanks, singleRanks }) {
  const anyOddRank = singleRanks.some((r) => r.oddRank) || averageRanks.some((r) => r.oddRank);

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
                person={person}
                key={event.id}
                eventId={event.id}
                averages={averageRanks}
                singles={singleRanks}
                anyOddRank={anyOddRank}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
