import React, { useMemo } from 'react';
import { Table } from 'semantic-ui-react';
import _ from 'lodash';
import I18n from '../../../lib/i18n';
import { formatAttemptResult } from '../../../lib/wca-live/attempts';
import CountryFlag from '../../wca/CountryFlag';
import { continents, countries } from '../../../lib/wca-data.js.erb';
import { personUrl } from '../../../lib/requests/routes.js.erb';

function CountryCell({ country }) {
  return (
    <Table.Cell textAlign="left">
      {country.iso2 && <CountryFlag iso2={country.iso2} />}
      {' '}
      {country.name}
    </Table.Cell>
  );
}

function ResultRow({
  result, competition, rank, isAverage, show, country, key,
}) {
  const attempts = [result.value1, result.value2, result.value3, result.value4, result.value5]
    .filter(Boolean);
  const bestResult = _.max(attempts);
  const worstResult = _.min(attempts);
  const bestResultIndex = attempts.indexOf(bestResult);
  const worstResultIndex = attempts.indexOf(worstResult);
  return (
    <Table.Row>
      {show === 'by region' ? <CountryCell country={country} />
        : <Table.Cell textAlign="center">{rank}</Table.Cell> }
      <Table.Cell>
        <a href={personUrl(result.personId)}>{result.personName}</a>
      </Table.Cell>
      <Table.Cell>
        {formatAttemptResult(result.value, result.eventId)}
      </Table.Cell>
      {show !== 'by region' && <CountryCell country={country} />}
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

export default function RankingsTable({
  rows, competitionsById, isAverage, show,
}) {
  const results = useMemo(() => {
    let rowsToMap = rows;
    let firstContinentIndex = 0;
    let firstCountryIndex = 0;
    if (show === 'by region') {
      [rowsToMap, firstContinentIndex, firstCountryIndex] = rows;
    }

    return rowsToMap.reduce((acc, result, index) => {
      const competition = competitionsById[result.competitionId];
      const { value } = result;

      const lastItem = acc[acc.length - 1];
      const previousValue = lastItem?.result.value || 0;
      const previousRank = lastItem?.rank || 0;

      const rank = value === previousValue ? previousRank : index + 1;
      const tiedPrevious = rank === previousRank;

      let country = countries.real.find((c) => c.id === result.countryId);
      if (index < firstContinentIndex) {
        country = { name: I18n.t('results.table_elements.world') };
      } else if (index >= firstContinentIndex && index < firstCountryIndex) {
        country = continents.real.find((c) => c.id === country.continentId);
      }

      acc.push({
        result,
        competition,
        country,
        rank,
        tiedPrevious,
        key: `${result.id}-${show}`,
      });

      return acc;
    }, []);
  }, [competitionsById, rows, show]);
  return (
    <div style={{ overflowX: 'scroll' }}>
      <Table basic="very" compact="very" singleLine striped unstackable>
        <Table.Header>
          {show !== 'by region' ? <Table.HeaderCell textAlign="center">#</Table.HeaderCell>
            : <Table.HeaderCell>{I18n.t('results.table_elements.region')}</Table.HeaderCell>}
          <Table.HeaderCell>{I18n.t('results.table_elements.name')}</Table.HeaderCell>
          <Table.HeaderCell>{I18n.t('results.table_elements.result')}</Table.HeaderCell>
          {show !== 'by region'
            && <Table.HeaderCell textAlign="left">{I18n.t('results.table_elements.representing')}</Table.HeaderCell>}
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
        <Table.Body key={show}>
          {results.map((r) => (
            <ResultRow
              country={r.country}
              key={r.key}
              result={r.result}
              competition={r.competition}
              rank={r.rank}
              tiedPrevious={r.tiedPrevious}
              isAverage={isAverage}
              show={show}
            />
          ))}
        </Table.Body>
      </Table>
    </div>
  );
}
