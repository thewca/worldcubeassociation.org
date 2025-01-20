import React from 'react';
import { Table } from 'semantic-ui-react';
import { SlimHeader } from '../TableHeaders';
import { SlimRecordsRow } from '../TableRows';

export default function SlimRecordsTable({ rows }) {
  return (
    <Table basic="very" compact="very" striped unstackable>
      <SlimHeader />
      <Table.Body>
        {rows.map((row) => <SlimRecordsRow row={row} />)}
      </Table.Body>
    </Table>
  );
}
