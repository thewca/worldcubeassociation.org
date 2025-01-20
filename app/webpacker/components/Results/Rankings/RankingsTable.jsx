import React, { useMemo } from 'react';
import { Table } from 'semantic-ui-react';
import _ from 'lodash';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
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
    const isByRegion = show === 'by region';
    const [rowsToMap, firstContinentIndex, firstCountryIndex] = isByRegion ? rows : [rows, 0, 0];

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
        key: `${result.id}-${show}-${country.name}`,
      });

      return acc;
    }, []);
  }, [competitionsById, rows, show]);

  const columns = useMemo(() => {
    const commonColumns = [
      {
        accessorKey: 'rank',
        header: show !== 'by region' ? '#' : I18n.t('results.table_elements.region'),
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
      commonColumns.push({
        accessorKey: 'solves',
        header: I18n.t('results.table_elements.solves'),
      });
      commonColumns.push(
        ...Array(4).fill({
          accessorKey: '',
          header: ' ',
        }),
      );
    }

    return commonColumns;
  }, [show, isAverage]);

  const table = useReactTable({
    data: results,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div style={{ overflowX: 'scroll' }}>
      <Table basic="very" compact="very" singleLine striped unstackable>
        <Table.Header>
          {table.getHeaderGroups().map((headerGroup) => (
            <Table.Row key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <Table.HeaderCell key={header.id}>
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
                key={row.key}
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
