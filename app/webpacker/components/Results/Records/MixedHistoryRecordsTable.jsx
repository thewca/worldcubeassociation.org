import React from 'react';
import { historyConfig } from '../TableRows';
import DataTable from './DataTable';

export default function MixedHistoryRecordsTable({
  results,
}) {
  return (
    <DataTable rows={results} config={historyConfig(true)} />
  );
}
