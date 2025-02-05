import { Table } from 'semantic-ui-react';
import React from 'react';
import RecordsTable from '../RecordsTable';
import { SeparateHeader } from '../TableHeaders';
import { SeparateRecordsRow } from '../TableRows';

export default function RankingTypeTable({ results, rankingType }) {
  return (
    <RecordsTable>
      <SeparateHeader isAverage={rankingType === 'average'} />
      <Table.Body>
        {results.map((row) => (
          <SeparateRecordsRow
            key={row.key}
            result={row.result}
            competition={row.competition}
            rankingType={rankingType}
            country={row.country}
          />
        ))}
      </Table.Body>
    </RecordsTable>
  );
}
