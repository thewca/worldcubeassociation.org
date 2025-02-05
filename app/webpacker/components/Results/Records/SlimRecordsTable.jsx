import React from 'react';
import { Table } from 'semantic-ui-react';
import { SlimHeader } from '../TableHeaders';
import { SlimRecordsRow } from '../TableRows';
import RecordsTable from '../RecordsTable';

export default function SlimRecordsTable({ results }) {
  const [slimmedRows] = results;

  return (
    <RecordsTable>
      <SlimHeader />
      <Table.Body>
        {slimmedRows.map((row) => (
          <SlimRecordsRow key={row[0]?.id + row[1]?.id} row={row} />
        ))}
      </Table.Body>
    </RecordsTable>
  );
}
