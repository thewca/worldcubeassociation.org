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

export default function RankingsTable({ filterState }) {
  const {
    event, region, rankingType, gender, show,
  } = filterState;

  const isAverage = rankingType === 'average';

  const { data, isFetching } = useQuery({
    queryKey: ['rankings', event, region, rankingType, gender, show],
    queryFn: () => getRankings(event, rankingType, region, gender, show),
    placeholderData: { rows: [], competitionsById: {} },
  });

  const { rows, competitionsById } = data;

  const results = useMemo(() => {
    const isByRegion = show === 'by region';
    const [rowsToMap, firstContinentIndex, firstCountryIndex] = isByRegion ? rows : [rows, 0, 0];

    return rowsToMap?.reduce((acc, result, index) => {
      const competition = competitionsById[result.competitionId];
      const { value } = result;

      const lastItem = acc[acc.length - 1];
      const previousValue = lastItem?.result.value || 0;
      const previousRank = lastItem?.rank || 0;

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
    }, []) || [];
  }, [competitionsById, rows, show]);

  const columns = useMemo(() => {
    const commonColumns = [
      {
        accessorKey: 'rank',
        header: show === 'by region' ? I18n.t('results.table_elements.region') : '#',
      },
      {
        accessorKey: 'result.name',
        header: I18n.t('results.table_elements.name'),
      },
      {
        accessorKey: 'result.value',
        header: I18n.t('results.table_elements.result'),
      },
    ];

    if (show !== 'by region') {
      commonColumns.push({
        accessorKey: 'country.name',
        header: I18n.t('results.table_elements.representing'),
      });
    }

    commonColumns.push({
      accessorKey: 'competition.name',
      header: I18n.t('results.table_elements.competition'),
    });

    if (isAverage) {
      // One Cell per Solve of an Average
      commonColumns.push({
        accessorKey: 'solves',
        header: I18n.t('results.table_elements.solves'),
        colSpan: 5,
      });
    }

    return commonColumns;
  }, [show, isAverage]);

  const table = useReactTable({
    data: results,
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
          {table.getRowModel().rows.map((row) => {
            const {
              country, result, competition, rank, tiedPrevious,
            } = row.original;

            return (
              <ResultRow
                country={country}
                key={row.id}
                result={result}
                competition={competition}
                rank={rank}
                tiedPrevious={tiedPrevious}
                isAverage={isAverage}
                show={show}
              />
            );
          })}
        </Table.Body>
      </Table>
    </div>
  );
}
