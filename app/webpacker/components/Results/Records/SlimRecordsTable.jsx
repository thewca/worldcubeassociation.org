import React from 'react';
import { Table } from 'semantic-ui-react';
import { SlimHeader } from '../TableHeaders';
import { SlimRecordsRow } from '../TableRows';

export default function SlimRecordsTable({ records }) {
  return (
    <Table basic="very" compact="very" striped unstackable>
      <SlimHeader />
      <Table.Body>
        {records[0].map((row) => <SlimRecordsRow row={row} />)}
      </Table.Body>
    </Table>
  );
}
