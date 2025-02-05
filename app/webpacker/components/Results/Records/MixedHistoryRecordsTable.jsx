import React from 'react';
import { Table } from 'semantic-ui-react';
import { HistoryRow } from '../TableRows';
import { HistoryHeader } from '../TableHeaders';
import RecordsTable from '../RecordsTable';

export default function MixedHistoryRecordsTable({
  results,
}) {
  return (
    <RecordsTable>
      <HistoryHeader mixed />
      <Table.Body>
        {results.map((r) => (
          <HistoryRow
            country={r.country}
            key={r.key}
            result={r.result}
            competition={r.competition}
            rank={r.rank}
            tiedPrevious={r.tiedPrevious}
            isMixed
          />
        ))}
      </Table.Body>
    </RecordsTable>
  );
}
