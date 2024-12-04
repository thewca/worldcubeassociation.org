import React from 'react';
import { Icon, Popup, Table } from 'semantic-ui-react';
import I18nHTMLTranslate from '../../I18nHTMLTranslate';
import { events } from '../../../lib/wca-data.js.erb';
import I18n from '../../../lib/i18n';
import EventIcon from '../../wca/EventIcon';

function RankCell({ ranks, type }) {
  if (!ranks) return <Table.Cell />;

  const rank = ranks[`${type}Rank`];
  if (rank === undefined) return <Table.Cell />;

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

function EventData({ event, person, anyOdd }) {
  const singles = person.singleRanks;
  const averages = person.averageRanks;

  const singleForEvent = singles.find((r) => r.eventId === event);
  const averageForEvent = averages.find((r) => r.eventId === event);
  if (!singleForEvent && !averageForEvent) return null;

  const isOdd = singleForEvent.oddRank || averageForEvent?.oddRank;

  return (
    <Table.Row textAlign="right">
      <Table.Cell textAlign="left">
        <EventIcon id={event} />
        {' '}
        <I18nHTMLTranslate i18nKey={`events.${event}`} />
      </Table.Cell>
      <RankCell ranks={singleForEvent} type="country" />
      <RankCell ranks={singleForEvent} type="continent" />
      <RankCell ranks={singleForEvent} type="world" />
      <Table.Cell><b>{singleForEvent?.time}</b></Table.Cell>
      <Table.Cell><b>{averageForEvent?.time}</b></Table.Cell>
      <RankCell ranks={averageForEvent} type="world" />
      <RankCell ranks={averageForEvent} type="continent" />
      <RankCell ranks={averageForEvent} type="country" />
      {anyOdd && (
        <Table.Cell>
          {isOdd && (
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

export default function RecordTable({ person }) {
  const { singleRanks, averageRanks } = person;
  const anyOddRank = singleRanks.some((r) => r.oddRank) || averageRanks.some((r) => r.oddRank);

  return (
    <Table unstackable compact="very" singleLine basic="very" striped>
      <Table.Header>
        <Table.Row textAlign="right">
          <Table.HeaderCell textAlign="left">Event</Table.HeaderCell>
          <Table.HeaderCell>NR</Table.HeaderCell>
          <Table.HeaderCell>CR</Table.HeaderCell>
          <Table.HeaderCell>WR</Table.HeaderCell>
          <Table.HeaderCell>Single</Table.HeaderCell>
          <Table.HeaderCell>Average</Table.HeaderCell>
          <Table.HeaderCell>WR</Table.HeaderCell>
          <Table.HeaderCell>CR</Table.HeaderCell>
          <Table.HeaderCell>NR</Table.HeaderCell>
          {anyOddRank && <Table.HeaderCell />}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {events.official.map((event) => (
          <EventData
            key={event.id}
            event={event.id}
            person={person}
            anyOdd={anyOddRank}
          />
        ))}
      </Table.Body>
    </Table>
  );
}
