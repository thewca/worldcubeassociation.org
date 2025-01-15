import React from 'react';
import { Header, Table } from 'semantic-ui-react';
import _ from 'lodash';
import I18n from '../../../lib/i18n';
import { formatAttemptResult } from '../../../lib/wca-live/attempts';
import { countries, events } from '../../../lib/wca-data.js.erb';
import { personUrl } from '../../../lib/requests/routes.js.erb';
import EventIcon from '../../wca/EventIcon';
import CountryFlag from '../../wca/CountryFlag';

export default function SeparateRecordsTable({ rows, competitionsById }) {
  const [, single, average] = rows;

  return (
    <>
      <Header>{I18n.t('results.selector_elements.type_selector.single')}</Header>
      <RankingTypeTable records={single} competitionsById={competitionsById} rankingType="single" />
      <Header>{I18n.t('results.selector_elements.type_selector.average')}</Header>
      <RankingTypeTable records={average} competitionsById={competitionsById} rankingType="average" />
    </>
  );
}

function RankingTypeTable({ records, rankingType, competitionsById }) {
  return (
    <Table basic="very" compact="very" striped unstackable singleLine>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>{I18n.t('results.table_elements.event')}</Table.HeaderCell>
          <Table.HeaderCell>{I18n.t('results.table_elements.result')}</Table.HeaderCell>
          <Table.HeaderCell>{I18n.t('results.table_elements.name')}</Table.HeaderCell>
          <Table.HeaderCell>{I18n.t('results.table_elements.region')}</Table.HeaderCell>
          <Table.HeaderCell>{I18n.t('results.table_elements.competition')}</Table.HeaderCell>
          { rankingType === 'average' && (
            <>
              <Table.HeaderCell>{I18n.t('results.table_elements.solves')}</Table.HeaderCell>
              <Table.HeaderCell />
              <Table.HeaderCell />
              <Table.HeaderCell />
              <Table.HeaderCell />
            </>
          )}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {records.map((row) => {
          const attempts = [row?.value1, row?.value2, row?.value3, row?.value4, row?.value5];
          const bestResult = _.max(attempts);
          const worstResult = _.min(attempts);
          const bestResultIndex = attempts.indexOf(bestResult);
          const worstResultIndex = attempts.indexOf(worstResult);
          const competition = competitionsById[row.competitionId];
          const country = countries.real.find((c) => c.id === row.countryId);
          return (
            <Table.Row>
              <Table.Cell>
                <EventIcon id={row.eventId} />
                {' '}
                {events.byId[row.eventId].name}
              </Table.Cell>
              <Table.Cell>
                {formatAttemptResult(row.value, row.eventId)}
              </Table.Cell>
              <Table.Cell>
                <a href={personUrl(row.personId)}>{row.personName}</a>
              </Table.Cell>
              <Table.Cell textAlign="left">
                {country.iso2 && <CountryFlag iso2={country.iso2} />}
                {' '}
                {country.name}
              </Table.Cell>
              <Table.Cell>
                <CountryFlag iso2={competition.country.iso2} />
                {' '}
                <a href={`/competition/${competition.id}`}>{competition.cellName}</a>
              </Table.Cell>
              {rankingType === 'average' && (
                <>
                  {attempts.map((a, i) => (
                    <Table.Cell>
                      { attempts.filter(Boolean).length === 5
                      && (i === bestResultIndex || i === worstResultIndex)
                        ? `(${formatAttemptResult(a, row.eventId)})` : formatAttemptResult(a, row.eventId)}
                    </Table.Cell>
                  ))}
                </>
              )}
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table>
  );
}
