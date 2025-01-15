import React, { useMemo } from 'react';
import { Header, Table } from 'semantic-ui-react';
import _ from 'lodash';
import { DateTime } from 'luxon';
import I18n from '../../../lib/i18n';
import { formatAttemptResult } from '../../../lib/wca-live/attempts';
import CountryFlag from '../../wca/CountryFlag';
import { countries, events } from '../../../lib/wca-data.js.erb';
import { personUrl } from '../../../lib/requests/routes.js.erb';
import { WCA_EVENT_IDS } from '../../wca/EventSelector';
import EventIcon from '../../wca/EventIcon';

export default function RecordsTable({
  rows, competitionsById, show,
}) {
  const results = useMemo(() => {
    const r = rows.map((result) => {
      const competition = competitionsById[result.competitionId];
      const country = countries.real.find((c) => c.id === result.countryId);

      return {
        result,
        competition,
        country,
        key: `${result.id}-${show}-${result.type}`,
      };
    });
    if (show !== 'mixed history') {
      return _.groupBy(r, 'result.eventId');
    }
    return r;
  }, [competitionsById, rows, show]);
  return (
    <div style={{ overflowX: 'scroll' }}>
      { show === 'mixed' ? WCA_EVENT_IDS.map((id) => Object.keys(results).includes(id)
          && <RecordTable record={results[id]} eventId={id} show={show} />)
        : <RecordTable record={results} show={show} />}
    </div>
  );
}

function CountryCell({ country }) {
  return (
    <Table.Cell textAlign="left">
      {country.iso2 && <CountryFlag iso2={country.iso2} />}
      {' '}
      {country.name}
    </Table.Cell>
  );
}

function HistoryHeader({ mixed }) {
  return (
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell>{I18n.t('results.table_elements.date_circa')}</Table.HeaderCell>
        {mixed && <Table.HeaderCell>{I18n.t('results.table_elements.event')}</Table.HeaderCell>}
        <Table.HeaderCell width={3}>{I18n.t('results.table_elements.name')}</Table.HeaderCell>
        <Table.HeaderCell>{I18n.t('common.single')}</Table.HeaderCell>
        <Table.HeaderCell>{I18n.t('common.average')}</Table.HeaderCell>
        <Table.HeaderCell width={2}>{I18n.t('results.table_elements.region')}</Table.HeaderCell>
        <Table.HeaderCell width={3}>{I18n.t('results.table_elements.competition')}</Table.HeaderCell>
        <Table.HeaderCell>{I18n.t('results.table_elements.solves')}</Table.HeaderCell>
        <Table.HeaderCell />
        <Table.HeaderCell />
        <Table.HeaderCell />
        <Table.HeaderCell />
      </Table.Row>
    </Table.Header>
  );
}

function MixedHeader() {
  return (
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell>{I18n.t('results.selector_elements.type_selector.type')}</Table.HeaderCell>
        <Table.HeaderCell width={3}>{I18n.t('results.table_elements.name')}</Table.HeaderCell>
        <Table.HeaderCell>{I18n.t('results.table_elements.result')}</Table.HeaderCell>
        <Table.HeaderCell width={2}>{I18n.t('results.table_elements.region')}</Table.HeaderCell>
        <Table.HeaderCell width={3}>{I18n.t('results.table_elements.competition')}</Table.HeaderCell>
        <Table.HeaderCell>{I18n.t('results.table_elements.solves')}</Table.HeaderCell>
        <Table.HeaderCell />
        <Table.HeaderCell />
        <Table.HeaderCell />
        <Table.HeaderCell />
      </Table.Row>
    </Table.Header>
  );
}

function HistoryRow({
  result, competition, show, country, mixed,
}) {
  const attempts = [result.value1, result.value2, result.value3, result.value4, result.value5];
  const bestResult = _.max(attempts);
  const worstResult = _.min(attempts);
  const bestResultIndex = attempts.indexOf(bestResult);
  const worstResultIndex = attempts.indexOf(worstResult);
  return (
    <Table.Row>
      <Table.Cell>{DateTime.fromISO(result.start_date).toFormat('MMM dd, yyyy')}</Table.Cell>
      { mixed && (
      <Table.Cell>
        <EventIcon id={result.eventId} />
        {' '}
        {events.byId[result.eventId].name}
      </Table.Cell>
      )}
      <Table.Cell>
        <a href={personUrl(result.personId)}>{result.personName}</a>
      </Table.Cell>
      {result.type === 'average' && <Table.Cell />}
      <Table.Cell>
        {formatAttemptResult(result.value, result.eventId)}
      </Table.Cell>
      {result.type === 'single' && <Table.Cell />}
      {show !== 'by region' && <CountryCell country={country} />}
      <Table.Cell>
        <CountryFlag iso2={competition.country.iso2} />
        {' '}
        <a href={`/competition/${competition.id}`}>{competition.cellName}</a>
      </Table.Cell>
      {attempts.map((a, i) => (result.type === 'average' ? (
        <Table.Cell>
          { attempts.filter(Boolean).length === 5
          && (i === bestResultIndex || i === worstResultIndex)
            ? `(${formatAttemptResult(a, result.eventId)})` : formatAttemptResult(a, result.eventId)}
        </Table.Cell>
      ) : <Table.Cell />))}
    </Table.Row>
  );
}

function RecordRow({
  result, competition, show, country,
}) {
  const attempts = [result.value1, result.value2, result.value3, result.value4, result.value5];
  const bestResult = _.max(attempts);
  const worstResult = _.min(attempts);
  const bestResultIndex = attempts.indexOf(bestResult);
  const worstResultIndex = attempts.indexOf(worstResult);
  return (
    <Table.Row>
      <Table.Cell>{I18n.t(`results.selector_elements.type_selector.${result.type}`)}</Table.Cell>
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
      {attempts.map((a, i) => (result.type === 'average' ? (
        <Table.Cell>
          { attempts.filter(Boolean).length === 5
          && (i === bestResultIndex || i === worstResultIndex)
            ? `(${formatAttemptResult(a, result.eventId)})` : formatAttemptResult(a, result.eventId)}
        </Table.Cell>
      ) : <Table.Cell />))}
    </Table.Row>
  );
}

function RecordTable({ record, eventId, show }) {
  return (
    <>
      { show === 'mixed' && <Header>{events.byId[eventId].name}</Header>}
      <Table basic="very" compact="very" striped unstackable singleLine>
        { show === 'mixed' ? <MixedHeader /> : <HistoryHeader mixed={show === 'mixed history'} /> }
        <Table.Body>
          {record.map((r) => (show === 'mixed' ? (
            <RecordRow
              country={r.country}
              key={r.key}
              result={r.result}
              competition={r.competition}
              rank={r.rank}
              tiedPrevious={r.tiedPrevious}
            />
          ) : (
            <HistoryRow
              country={r.country}
              key={r.key}
              result={r.result}
              competition={r.competition}
              rank={r.rank}
              tiedPrevious={r.tiedPrevious}
              mixed={show === 'mixed history'}
            />
          )))}
        </Table.Body>
      </Table>
    </>
  );
}
