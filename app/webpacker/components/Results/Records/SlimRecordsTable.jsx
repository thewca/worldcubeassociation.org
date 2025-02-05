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
        {slimmedRows.map((row) => {
          const combinedKey = [
            row[0]?.key,
            row[1]?.key,
          ].filter(Boolean).join('-');

          return (
            <SlimRecordsRow key={combinedKey} row={row} />
          );
        })}
      </Table.Body>
    </RecordsTable>
  );
}
