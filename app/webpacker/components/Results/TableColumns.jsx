import React from 'react';
import _ from 'lodash';
import { Table } from 'semantic-ui-react';
import { formatAttemptResult } from '../../lib/wca-live/attempts';
import I18n from '../../lib/i18n';
import { countries } from '../../lib/wca-data.js.erb';
import {
  AttemptsCells,
  CompetitionCell,
  CountryCell,
  EventCell,
  PersonCell,
} from './TableCells';

function resultAttempts(result) {
  const definedAttempts = [
    result?.value1,
    result?.value2,
    result?.value3,
    result?.value4,
    result?.value5,
  ].filter((res) => res !== undefined);

  const validAttempts = definedAttempts.filter((res) => res !== 0);
  const completedAttempts = validAttempts.filter((res) => res > 0);
  const uncompletedAttempts = validAttempts.filter((res) => res < 0);

  // DNF/DNS values are very small. If all solves were successful,
  //   then `uncompletedAttempts` is empty and the min is `undefined`,
  //   which means we fall back to the actually slowest value.
  const worstResult = _.min(uncompletedAttempts) || _.max(validAttempts);
  const bestResult = _.min(completedAttempts);

  const bestResultIndex = definedAttempts.indexOf(bestResult);
  const worstResultIndex = definedAttempts.indexOf(worstResult);

  return [definedAttempts, bestResultIndex, worstResultIndex];
}

export const resultsFiveWideColumn = {
  accessorKey: 'result',
  header: I18n.t('results.table_elements.solves'),
  colSpan: 5,
  rendersOwnCells: true,
  cell: ({ getValue }) => {
    const result = getValue();

    if (!result) return (<Table.Cell />);

    const [attempts, bestResultIndex, worstResultIndex] = resultAttempts(result);

    return (
      <AttemptsCells
        attempts={attempts}
        bestResultIndex={bestResultIndex}
        worstResultIndex={worstResultIndex}
        eventId={result.eventId}
      />
    );
  },
};

export const competitionColumn = {
  accessorKey: 'competition',
  header: I18n.t('results.table_elements.competition'),
  cell: ({ getValue }) => (
    <CompetitionCell
      competition={getValue()}
      compatIso2={countries.byId[getValue().countryId]?.iso2}
    />
  ),
};

export const regionColumn = {
  accessorKey: 'country',
  header: I18n.t('results.table_elements.region'),
  cell: ({ getValue }) => (
    <CountryCell country={getValue()} />
  ),
};

export const representingColumn = {
  accessorKey: 'country',
  header: I18n.t('results.table_elements.region'),
  cell: ({ getValue }) => (
    <CountryCell country={getValue()} />
  ),
};

export const attemptResultColumn = {
  accessorKey: 'result.value',
  header: I18n.t('results.table_elements.result'),
  cell: ({ row, getValue }) => formatAttemptResult(getValue(), row.original.result.eventId),
};

export const personColumn = {
  accessorKey: 'result.personName',
  header: I18n.t('results.table_elements.name'),
  cell: ({ row, getValue }) => (
    <PersonCell
      personId={row.original.result.personId}
      personName={getValue()}
    />
  ),
};

export const eventColumn = {
  accessorKey: 'result.eventId',
  header: I18n.t('results.table_elements.event'),
  cell: ({ getValue }) => <EventCell eventId={getValue()} />,
};

export const rankColumn = {
  accessorKey: 'rank',
  header: '#',
  textAlign: 'center',
  cell: ({ getValue }) => getValue(),
};
