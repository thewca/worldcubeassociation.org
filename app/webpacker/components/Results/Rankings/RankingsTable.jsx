import React, { useMemo } from 'react';
import { Table } from 'semantic-ui-react';
import _ from 'lodash';
import I18n from '../../../lib/i18n';
import { formatAttemptResult } from '../../../lib/wca-live/attempts';
import CountryFlag from '../../wca/CountryFlag';
import { countries } from '../../../lib/wca-data.js.erb';
import { personUrl } from '../../../lib/requests/routes.js.erb';

function ResultRow({
  result, competition, rank, isAverage,
}) {
  const attempts = [result.value1, result.value2, result.value3, result.value4, result.value5];
  const bestResult = _.max(attempts);
  const worstResult = _.min(attempts);
  const bestResultIndex = attempts.findIndex((a) => a === bestResult);
  const worstResultIndex = attempts.findIndex((a) => a === worstResult);
  const country = countries.real.find((c) => c.id === result.countryId);
  return (
    <Table.Row>
      <Table.Cell textAlign="center">{rank}</Table.Cell>
      <Table.Cell>
        <a href={personUrl(result.personId)}>{result.personName}</a>
      </Table.Cell>
      <Table.Cell>
        {formatAttemptResult(result.value, result.eventId)}
      </Table.Cell>
      <Table.Cell textAlign="left">
        <CountryFlag iso2={country.iso2} />
        {' '}
        {country.name}
      </Table.Cell>
      <Table.Cell>
        <CountryFlag iso2={competition.country.iso2} />
        {' '}
        <a href={`/competition/${competition.id}`}>{competition.cellName}</a>
      </Table.Cell>
      {isAverage && (attempts.map((a, i) => (
        <Table.Cell>
          { attempts.length === 5
              && (i === bestResultIndex || i === worstResultIndex)
            ? `(${formatAttemptResult(a, result.eventId)})` : formatAttemptResult(a, result.eventId)}
        </Table.Cell>
      ))
      )}
    </Table.Row>
  );
}

export default function RankingsTable({ rows, competitionsById, isAverage }) {
  const r = useMemo(() => {
    let previousValue = 0;
    let previousRank = 0;
    return rows.map((result, index) => {
      const competition = competitionsById[result.competitionId];
      const { value } = result;
      const rank = value === previousValue ? previousRank : index + 1;
      const tiedPrevious = rank === previousRank;

      previousValue = value;
      previousRank = rank;

      return (
        <ResultRow
          key={result.id}
          result={result}
          competition={competition}
          rank={rank}
          tiedPrevious={tiedPrevious}
          isAverage={isAverage}
        />
      );
    });
  }, [competitionsById, isAverage, rows]);

  return (
    <Table basic="very" compact="very" singleLine striped>
      <Table.Header>
        <Table.HeaderCell textAlign="center">#</Table.HeaderCell>
        <Table.HeaderCell>{I18n.t('results.table_elements.name')}</Table.HeaderCell>
        <Table.HeaderCell>{I18n.t('results.table_elements.result')}</Table.HeaderCell>
        <Table.HeaderCell textAlign="left">{I18n.t('results.table_elements.representing')}</Table.HeaderCell>
        <Table.HeaderCell>{I18n.t('results.table_elements.competition')}</Table.HeaderCell>
        {isAverage && (
          <>
            <Table.HeaderCell>{I18n.t('results.table_elements.solves')}</Table.HeaderCell>
            <Table.HeaderCell />
            <Table.HeaderCell />
            <Table.HeaderCell />
            <Table.HeaderCell />
          </>
        )}
      </Table.Header>
      <Table.Body>
        {r}
      </Table.Body>
    </Table>
  );
}
