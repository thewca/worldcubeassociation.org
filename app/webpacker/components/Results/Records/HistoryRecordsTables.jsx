import React from 'react';
import { historyConfig } from '../TableRows';
import DataTable from './DataTable';

export default function HistoryRecordsTable({ results }) {
  return (
    <DataTable rows={results} config={historyConfig(false)} />
  );
}
