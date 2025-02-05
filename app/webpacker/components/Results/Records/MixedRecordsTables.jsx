import React from 'react';
import { Table } from 'semantic-ui-react';
import { RecordRow } from '../TableRows';
import { MixedHeader } from '../TableHeaders';
import RecordsTable from '../RecordsTable';

export default function MixedRecordsTable({ results }) {
  return (
    <RecordsTable>
      <MixedHeader />
      <Table.Body>
        {results.map((r) => (
          <RecordRow
            country={r.country}
            key={r.key}
            result={r.result}
            competition={r.competition}
            rank={r.rank}
            tiedPrevious={r.tiedPrevious}
          />
        ))}
      </Table.Body>
    </RecordsTable>
  );
}
