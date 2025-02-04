import React, { useMemo } from 'react';
import { Table } from 'semantic-ui-react';
import _ from 'lodash';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import I18n from '../../../lib/i18n';
import { formatAttemptResult } from '../../../lib/wca-live/attempts';
import { continents, countries } from '../../../lib/wca-data.js.erb';
import { getRankings } from '../api/rankings';
import Loading from '../../Requests/Loading';
import {
  AttemptsCells,
  CompetitionCell,
  CountryCell,
  PersonCell,
} from '../TableCells';

function getCountryOrContinent(result, firstContinentIndex, firstCountryIndex, index) {
  if (index < firstContinentIndex) {
    return { name: I18n.t('results.table_elements.world') };
  }
  if (index >= firstContinentIndex && index < firstCountryIndex) {
    return continents.real.find((c) => c.id === countries.byId[result.countryId].continentId);
  }
  return countries.byId[result.countryId];
}

function mapRankingsData(data, isByRegion) {
  const { rows, competitionsById } = data;
  const [rowsToMap, firstContinentIndex, firstCountryIndex] = isByRegion ? rows : [rows, 0, 0];

  return rowsToMap.reduce((acc, result, index) => {
    const competition = competitionsById[result.competitionId];
    const { value } = result;

    const previousItem = acc[acc.length - 1];
    const previousValue = previousItem?.result.value || 0;
    const previousRank = previousItem?.rank || 0;

    const rank = value === previousValue ? previousRank : index + 1;
    const tiedPrevious = rank === previousRank;

    const country = getCountryOrContinent(result, firstContinentIndex, firstCountryIndex, index);

    return [...acc, {
      result,
      competition,
      country,
      rank,
      tiedPrevious,
    }];
  }, []);
}

export default function RankingsTable({ filterState }) {
  const {
    event, region, rankingType, gender, show,
  } = filterState;

  const isAverage = rankingType === 'average';

  const { data, isFetching } = useQuery({
    queryKey: ['rankings', event, region, rankingType, gender, show],
    queryFn: () => getRankings(event, rankingType, region, gender, show),
    select: (rankingsData) => mapRankingsData(rankingsData, show === 'by region'),
  });

  const columns = useMemo(() => {
    const rankColumn = {
      accessorKey: 'rank',
      header: '#',
      cell: ({ row }) => (
        <Table.Cell textAlign="center">{row.original.rank}</Table.Cell>
      ),
    };

    const regionColumn = {
      accessorKey: 'country',
      header: I18n.t('results.table_elements.region'),
      cell: ({ row }) => (
        <CountryCell country={row.original.country} />
      ),
    };

    const commonColumns = [
      show === 'by region' ? regionColumn : rankColumn,
      {
        accessorKey: 'result.name',
        header: I18n.t('results.table_elements.name'),
        cell: ({ row }) => (
          <PersonCell
            personId={row.original.result.personId}
            personName={row.original.result.personName}
          />
        ),
      },
      {
        accessorKey: 'result.value',
        header: I18n.t('results.table_elements.result'),
        cell: ({ row }) => (
          <Table.Cell>
            {formatAttemptResult(row.original.result.value, row.original.result.eventId)}
          </Table.Cell>
        ),
      },
    ];

    if (show !== 'by region') {
      commonColumns.push({
        accessorKey: 'country.name',
        header: I18n.t('results.table_elements.representing'),
        cell: ({ row }) => (<CountryCell country={row.original.country} />),
      });
    }

    commonColumns.push({
      accessorKey: 'competition.name',
      header: I18n.t('results.table_elements.competition'),
      cell: ({ row }) => (
        <CompetitionCell
          competition={row.original.competition}
          compatIso2={countries.byId[row.original.competition.countryId]?.iso2}
        />
      ),
    });

    if (isAverage) {
      // One Cell per Solve of an Average
      commonColumns.push({
        accessorKey: 'solves',
        header: I18n.t('results.table_elements.solves'),
        colSpan: 5,
        cell: ({ row }) => {
          const { result } = row.original;

          const attempts = [result.value1, result.value2, result.value3, result.value4, result.value5]
            .filter(Boolean);

          const bestResult = _.max(attempts);
          const worstResult = _.min(attempts);
          const bestResultIndex = attempts.indexOf(bestResult);
          const worstResultIndex = attempts.indexOf(worstResult);

          return (
            <AttemptsCells
              attempts={attempts}
              bestResultIndex={bestResultIndex}
              worstResultIndex={worstResultIndex}
              eventId={result.eventId}
            />
          );
        },
      });
    }

    return commonColumns;
  }, [show, isAverage]);

  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isFetching) return <Loading />;

  return (
    <div style={{ overflowX: 'scroll' }}>
      <Table basic="very" compact="very" singleLine striped unstackable>
        <Table.Header>
          {table.getHeaderGroups().map((headerGroup) => (
            <Table.Row key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <Table.HeaderCell key={header.id} colSpan={header.column.columnDef.colSpan}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </Table.HeaderCell>
              ))}
            </Table.Row>
          ))}
        </Table.Header>
        <Table.Body>
          {table.getRowModel().rows.map((row) => (
            <Table.Row key={row.id}>
              {row.getVisibleCells().map((cell) => {
                return flexRender(cell.column.columnDef.cell, cell.getContext());
              })}
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
}

function ResultRow({
  result, competition, rank, isAverage, show, country,
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
      <PersonCell personId={result.personId} personName={result.personName} />
      <Table.Cell>
        {formatAttemptResult(result.value, result.eventId)}
      </Table.Cell>
      {show !== 'by region' && <CountryCell country={country} />}
      <CompetitionCell
        competition={competition}
        compatIso2={countries.byId[competition.countryId]?.iso2}
      />
      {isAverage && (
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
