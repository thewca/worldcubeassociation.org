import React from 'react';
import { Table } from 'semantic-ui-react';
import { HistoryRow } from '../TableRows';
import { HistoryHeader } from '../TableHeaders';
import RecordsTable from '../RecordsTable';

export default function HistoryRecordsTable({ results }) {
  return (
    <RecordsTable>
      <HistoryHeader mixed={false} />
      <Table.Body>
        {results.map((r) => (
          <HistoryRow
            country={r.country}
            key={r.key}
            result={r.result}
            competition={r.competition}
            rank={r.rank}
            tiedPrevious={r.tiedPrevious}
            isMixed={false}
          />
        ))}
      </Table.Body>
    </RecordsTable>
  );
}
