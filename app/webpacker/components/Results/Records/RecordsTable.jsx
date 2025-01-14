import React, { useMemo } from 'react';
import { Header, Table } from 'semantic-ui-react';
import _ from 'lodash';
import I18n from '../../../lib/i18n';
import { formatAttemptResult } from '../../../lib/wca-live/attempts';
import CountryFlag from '../../wca/CountryFlag';
import { continents, countries, events } from '../../../lib/wca-data.js.erb';
import { personUrl } from '../../../lib/requests/routes.js.erb';
import { WCA_EVENT_IDS } from '../../wca/EventSelector';

function CountryCell({ country }) {
  return (
    <Table.Cell textAlign="left">
      {country.iso2 && <CountryFlag iso2={country.iso2} />}
      {' '}
      {country.name}
    </Table.Cell>
  );
}

function RecordRow({
  result, competition, show, country, key,
}) {
  const attempts = [result.value1, result.value2, result.value3, result.value4, result.value5]
    .filter(Boolean);
  const bestResult = _.max(attempts);
  const worstResult = _.min(attempts);
  const bestResultIndex = attempts.indexOf(bestResult);
  const worstResultIndex = attempts.indexOf(worstResult);
  return (
    <Table.Row key={key}>
      <Table.Cell>{result.type}</Table.Cell>
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
      {result.type === 'average' && (attempts.map((a, i) => (
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

function RecordTable({ record, eventId }) {
  return (
    <>
      <Header>{events.byId[eventId].name}</Header>
      <Table basic="very" compact="very" singleLine striped unstackable>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>{I18n.t('results.selector_elements.type_selector.type')}</Table.HeaderCell>
            <Table.HeaderCell>{I18n.t('results.table_elements.region')}</Table.HeaderCell>
            <Table.HeaderCell>{I18n.t('results.table_elements.name')}</Table.HeaderCell>
            <Table.HeaderCell>{I18n.t('results.table_elements.result')}</Table.HeaderCell>
            <Table.HeaderCell>{I18n.t('results.table_elements.competition')}</Table.HeaderCell>
            <Table.HeaderCell>{I18n.t('results.table_elements.solves')}</Table.HeaderCell>
            <Table.HeaderCell />
            <Table.HeaderCell />
            <Table.HeaderCell />
            <Table.HeaderCell />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {record.map((r) => (
            <RecordRow
              country={r.country}
              key={r.key}
              result={r.result}
              competition={r.competition}
              rank={r.rank}
              tiedPrevious={r.tiedPrevious}
            />
          ))}
        </Table.Body>
      </Table>
    </>
  );
}

export default function RecordsTable({
  rows, competitionsById, show,
}) {
  const results = useMemo(() => _.groupBy(rows.map((result) => {
    const competition = competitionsById[result.competitionId];
    const country = countries.real.find((c) => c.id === result.countryId);

    return {
      result,
      competition,
      country,
      key: `${result.id}-${show}`,
    };
  }), 'result.eventId'), [competitionsById, rows, show]);

  return (
    <div style={{ overflowX: 'scroll' }}>
      {WCA_EVENT_IDS.map((id) => <RecordTable record={results[id]} eventId={id} />)}
    </div>
  );
}
