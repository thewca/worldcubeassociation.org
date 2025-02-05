import React from 'react';
import { separateRecordsConfig } from '../TableRows';
import DataTable from './DataTable';

export default function RankingTypeTable({ results, rankingType }) {
  return (
    <DataTable rows={results} config={separateRecordsConfig(rankingType)} />
  );
}
