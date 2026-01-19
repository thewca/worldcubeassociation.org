import React from 'react';
import _ from 'lodash';
import { Table } from 'semantic-ui-react';
import { formatAttemptResult } from '../../lib/wca-live/attempts';
import I18n from '../../lib/i18n';
import {
  AttemptsCells,
  CompetitionCell,
  CountryCell,
  EventCell,
  PersonCell,
} from './TableCells';

function resultAttempts(result, minColSpan) {
  const definedAttempts = result.result_details
    .split(',')
    .map(Number)
    .filter((res) => res !== undefined);

  const paddedAttempts = Object.assign(
    new Array(minColSpan).fill(0),
    definedAttempts,
  );

  const validAttempts = paddedAttempts.filter((res) => res !== 0);
  const completedAttempts = validAttempts.filter((res) => res > 0);
  const uncompletedAttempts = validAttempts.filter((res) => res < 0);

  // DNF/DNS values are very small. If all solves were successful,
  //   then `uncompletedAttempts` is empty and the min is `undefined`,
  //   which means we fall back to the actually slowest value.
  const worstResult = _.min(uncompletedAttempts) || _.max(validAttempts);
  const bestResult = _.min(completedAttempts);

  const bestResultIndex = paddedAttempts.indexOf(bestResult);
  const worstResultIndex = paddedAttempts.indexOf(worstResult);

  return [paddedAttempts, bestResultIndex, worstResultIndex];
}

export const resultsFiveWideColumn = {
  accessorKey: 'result',
  header: I18n.t('results.table_elements.solves'),
  colSpan: 5,
  rendersOwnCells: true,
  cell: ({ getValue }) => {
    const result = getValue();

    if (!result) return (<Table.Cell />);

    const [attempts, bestResultIndex, worstResultIndex] = resultAttempts(result, 5);

    return (
      <AttemptsCells
        attempts={attempts}
        bestResultIndex={bestResultIndex}
        worstResultIndex={worstResultIndex}
        eventId={result.event_id}
      />
    );
  },
};

export const competitionColumn = {
  accessorKey: 'competition',
  header: I18n.t('results.table_elements.competition'),
  cell: ({ getValue }) => (
    <CompetitionCell competition={getValue()} />
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
  cell: ({ row, getValue }) => formatAttemptResult(getValue(), row.original.result.event_id),
};

export const personColumn = {
  accessorKey: 'result.person_name',
  header: I18n.t('results.table_elements.name'),
  cell: ({ row, getValue }) => (
    <PersonCell
      personId={row.original.result.person_id}
      personName={getValue()}
    />
  ),
};

export const eventColumn = {
  accessorKey: 'result.event_id',
  header: I18n.t('results.table_elements.event'),
  cell: ({ getValue }) => <EventCell eventId={getValue()} />,
};

export const rankColumn = {
  accessorKey: 'rank',
  header: '#',
  textAlign: 'center',
  cell: ({ getValue }) => getValue(),
};
