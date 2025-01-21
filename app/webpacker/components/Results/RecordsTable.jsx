import React from 'react';
import { Table } from 'semantic-ui-react';

export default function RecordsTable({ children }) {
  return (
    <Table basic="very" compact="very" striped unstackable singleLine>
      {children}
    </Table>
  );
}
