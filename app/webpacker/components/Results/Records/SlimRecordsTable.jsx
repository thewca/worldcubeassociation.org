import React from 'react';
import { slimConfig } from '../TableRows';
import DataTable from './DataTable';

export default function SlimRecordsTable({ results }) {
  const [slimmedRows] = results;

  // Need to re-key with `single` and `average` indices so that React-Table
  //   will have an easier time operating on the data.
  const slimmedData = slimmedRows.map(([single, average]) => ({ single, average }));

  return (
    <DataTable rows={slimmedData} config={slimConfig} />
  );
}
