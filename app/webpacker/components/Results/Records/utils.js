import { DateTime } from 'luxon';
import React from 'react';
import { countries } from '../../../lib/wca-data.js.erb';
import I18n from '../../../lib/i18n';
import {
  EventCell,
  PersonCell,
} from '../TableCells';
import { formatAttemptResult } from '../../../lib/wca-live/attempts';
import {
  attemptResultColumn,
  competitionColumn,
  personColumn,
  regionColumn,
  resultsFiveWideColumn,
  eventColumn,
} from '../TableColumns';

export function augmentResults(results, competitionsById) {
  return results.map((result) => {
    if (result === null) return null;

    const competition = competitionsById[result.competitionId];
    const country = countries.real.find((c) => c.id === result.countryId);

    return {
      result,
      competition,
      country,
      key: `${result.id}-${result.type}`,
    };
  });
}

export function augmentApiResults(data, show) {
  const { rows, competitionsById } = data;

  const isSlim = show === 'slim';
  const isSeparate = show === 'separate';

  if (isSlim || isSeparate) {
    const [slimmed, singleRows, averageRows] = rows;

    return [
      slimmed, // The 'slim' view does not need augmented data
      augmentResults(singleRows, competitionsById),
      augmentResults(averageRows, competitionsById),
    ];
  }

  return augmentResults(rows, competitionsById);
}

export const slimConfig = [
  {
    accessorKey: 'single.personName',
    header: I18n.t('results.table_elements.name'),
    cell: ({ row, getValue }) => (
      <PersonCell
        personId={row.original.single.personId}
        personName={getValue()}
      />
    ),
  },
  {
    accessorKey: 'single.value',
    header: I18n.t('common.single'),
    cell: ({ row, getValue }) => formatAttemptResult(getValue(), row.original.single.eventId),
  },
  {
    accessorKey: 'single.eventId',
    header: I18n.t('results.table_elements.event'),
    cell: ({ getValue }) => <EventCell eventId={getValue()} />,
  },
  {
    accessorKey: 'average.value',
    header: I18n.t('common.average'),
    cell: ({ row, getValue }) => (
      getValue() && formatAttemptResult(getValue(), row.original.average?.eventId)
    ),
  },
  {
    accessorKey: 'average.personName',
    header: I18n.t('results.table_elements.name'),
    cell: ({ row, getValue }) => getValue && (
      <PersonCell
        personId={row.original.average?.personId}
        personName={getValue()}
      />
    ),
  },
  {
    ...resultsFiveWideColumn,
    accessorKey: 'average',
  },
];

export const separateRecordsConfig = (rankingType) => [
  eventColumn,
  attemptResultColumn,
  personColumn,
  regionColumn,
  competitionColumn,
  rankingType === 'average' && resultsFiveWideColumn,
].filter(Boolean);

export const historyConfig = (isMixed) => [
  {
    accessorKey: 'result.start_date',
    header: I18n.t('results.table_elements.date_circa'),
    cell: ({ getValue }) => DateTime.fromISO(getValue()).toFormat('MMM dd, yyyy'),
  },
  isMixed && eventColumn,
  personColumn,
  {
    id: 'single',
    accessorKey: 'result.value',
    header: I18n.t('common.single'),
    cell: ({ row, getValue }) => (
      row.original.result.type === 'single'
        && formatAttemptResult(getValue(), row.original.result.eventId)
    ),
  },
  {
    id: 'average',
    accessorKey: 'result.value',
    header: I18n.t('common.average'),
    cell: ({ row, getValue }) => (
      row.original.result.type === 'average'
        && formatAttemptResult(getValue(), row.original.result.eventId)
    ),
  },
  regionColumn,
  competitionColumn,
  resultsFiveWideColumn,
].filter(Boolean);

export const mixedRecordsConfig = [
  {
    accessorKey: 'result.type',
    header: I18n.t('results.selector_elements.type_selector.type'),
    cell: ({ getValue }) => I18n.t(`results.selector_elements.type_selector.${getValue()}`),
  },
  personColumn,
  attemptResultColumn,
  regionColumn,
  competitionColumn,
  resultsFiveWideColumn,
];
