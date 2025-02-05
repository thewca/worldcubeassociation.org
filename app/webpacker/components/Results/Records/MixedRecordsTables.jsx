import React from 'react';
import { mixedRecordsConfig } from '../TableRows';
import DataTable from './DataTable';

export default function MixedRecordsTable({ results }) {
  return <DataTable rows={results} config={mixedRecordsConfig} />;
}
