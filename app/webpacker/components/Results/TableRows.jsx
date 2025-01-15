import React from 'react';
import _ from 'lodash';
import { Table } from 'semantic-ui-react';
import { DateTime } from 'luxon';
import EventIcon from '../wca/EventIcon';
import { formatAttemptResult } from '../../lib/wca-live/attempts';
import CountryFlag from '../wca/CountryFlag';
import I18n from '../../lib/i18n';
import { personUrl } from '../../lib/requests/routes.js.erb';
import { CountryCell } from './TableCells';
import { countries, events } from '../../lib/wca-data.js.erb';

function resultAttempts(result) {
  const attempts = [result?.value1, result?.value2, result?.value3, result?.value4, result?.value5];
  const bestResult = _.max(attempts);
  const worstResult = _.min(attempts);
  const bestResultIndex = attempts.indexOf(bestResult);
  const worstResultIndex = attempts.indexOf(worstResult);
  return [attempts, bestResultIndex, worstResultIndex];
}

export function SlimRecordsRow({ row }) {
  const [single, average] = row;
  const [attempts, bestResultIndex, worstResultIndex] = resultAttempts(average);
  return (
    <Table.Row>
      <Table.Cell>
        <a href={personUrl(single.personId)}>{single.personName}</a>
      </Table.Cell>
      <Table.Cell>
        {formatAttemptResult(single.value, single.eventId)}
      </Table.Cell>
      <Table.Cell>
        <EventIcon id={single.eventId} />
        {' '}
        {events.byId[single.eventId].name}
      </Table.Cell>
      {average && (
        <>
          <Table.Cell>
            {formatAttemptResult(average.value, average.eventId)}
          </Table.Cell>
          <Table.Cell>
            <a href={personUrl(average.personId)}>{average.personName}</a>
          </Table.Cell>
          {attempts.map((a, i) => (
            <Table.Cell>
              { attempts.filter(Boolean).length === 5
              && (i === bestResultIndex || i === worstResultIndex)
                ? `(${formatAttemptResult(a, average.eventId)})` : formatAttemptResult(a, average.eventId)}
            </Table.Cell>
          ))}
        </>
      )}
    </Table.Row>
  );
}

export function SeparateRecordsRow({ result, competition, rankingType }) {
  const [attempts, bestResultIndex, worstResultIndex] = resultAttempts(result);
  const country = countries.real.find((c) => c.id === result.countryId);
  return (
    <Table.Row>
      <Table.Cell>
        <EventIcon id={result.eventId} />
        {' '}
        {events.byId[result.eventId].name}
      </Table.Cell>
      <Table.Cell>
        {formatAttemptResult(result.value, result.eventId)}
      </Table.Cell>
      <Table.Cell>
        <a href={personUrl(result.personId)}>{result.personName}</a>
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
                ? `(${formatAttemptResult(a, result.eventId)})` : formatAttemptResult(a, result.eventId)}
            </Table.Cell>
          ))}
        </>
      )}
    </Table.Row>
  );
}

export function HistoryRow({
  result, competition, show, country, mixed,
}) {
  const [attempts, bestResultIndex, worstResultIndex] = resultAttempts(result);
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

export function RecordRow({
  result, competition, show, country,
}) {
  const [attempts, bestResultIndex, worstResultIndex] = resultAttempts(result);
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
