import React from 'react';
import _ from 'lodash';
import { Table } from 'semantic-ui-react';
import { DateTime } from 'luxon';
import { formatAttemptResult } from '../../lib/wca-live/attempts';
import CountryFlag from '../wca/CountryFlag';
import I18n from '../../lib/i18n';
import {
  AttemptsCells, CompetitionCell, CountryCell, EventCell, PersonCell,
} from './TableCells';
import { countries } from '../../lib/wca-data.js.erb';

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
      <PersonCell personId={single.personId} personName={single.personName} />
      <Table.Cell>{formatAttemptResult(single.value, single.eventId)}</Table.Cell>
      <EventCell eventId={single.eventId} />
      {average && (
        <>
          <Table.Cell>{formatAttemptResult(average.value, average.eventId)}</Table.Cell>
          <PersonCell personId={average.personId} personName={average.personName} />
          <AttemptsCells
            attempts={attempts}
            bestResultIndex={bestResultIndex}
            worstResultIndex={worstResultIndex}
            eventId={average.eventId}
          />
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
      <EventCell eventId={result.eventId} />
      <Table.Cell>{formatAttemptResult(result.value, result.eventId)}</Table.Cell>
      <PersonCell personId={result.personId} personName={result.personName} />
      <Table.Cell textAlign="left">
        {country.iso2 && <CountryFlag iso2={country.iso2} />}
        {' '}
        {country.name}
      </Table.Cell>
      <CompetitionCell competition={competition} />
      {rankingType === 'average' && (
        <AttemptsCells
          attempts={attempts}
          bestResultIndex={bestResultIndex}
          worstResultIndex={worstResultIndex}
          eventId={result.eventId}
        />
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
      {mixed && <EventCell eventId={result.eventId} />}
      <PersonCell personId={result.personId} personName={result.personName} />
      {result.type === 'average' && <Table.Cell />}
      <Table.Cell>{formatAttemptResult(result.value, result.eventId)}</Table.Cell>
      {result.type === 'single' && <Table.Cell />}
      {show !== 'by region' && <CountryCell country={country} />}
      <CompetitionCell competition={competition} />
      <AttemptsCells
        attempts={attempts}
        bestResultIndex={bestResultIndex}
        worstResultIndex={worstResultIndex}
        eventId={result.eventId}
      />
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
      <PersonCell personId={result.personId} personName={result.personName} />
      <Table.Cell>{formatAttemptResult(result.value, result.eventId)}</Table.Cell>
      {show !== 'by region' && <CountryCell country={country} />}
      <CompetitionCell competition={competition} />
      <AttemptsCells
        attempts={attempts}
        bestResultIndex={bestResultIndex}
        worstResultIndex={worstResultIndex}
        eventId={result.eventId}
      />
    </Table.Row>
  );
}
