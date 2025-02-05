import { useQuery } from '@tanstack/react-query';
import { Segment } from 'semantic-ui-react';
import React from 'react';
import { getRecords } from '../api/records';
import Loading from '../../Requests/Loading';
import GroupedEventsTable from './GroupedEventsTable';
import GroupedRankingTypesTable from './GroupedRankingTypesTable';
import {
  augmentApiResults,
  historyConfig,
  mixedRecordsConfig,
  separateRecordsConfig,
  slimConfig,
} from './utils';
import DataTable from '../DataTable';

function SlimRecordsTable({ results }) {
  const [slimmedRows] = results;

  // Need to re-key with `single` and `average` indices so that React-Table
  //   will have an easier time operating on the data.
  const slimmedData = slimmedRows.map(([single, average]) => ({ single, average }));

  return (
    <DataTable rows={slimmedData} config={slimConfig} />
  );
}

export default function RecordsTable({ filterState }) {
  const {
    event, region, gender, show,
  } = filterState;

  const { data: rows, isFetching } = useQuery({
    queryKey: ['records', event, region, gender, show],
    queryFn: () => getRecords(event, region, gender, show),
    select: (recordsData) => augmentApiResults(recordsData, show),
  });

  if (isFetching) return <Loading />;
  if (rows.length === 0) return <Segment>No results found</Segment>;

  switch (show) {
    case 'mixed':
      return (
        <GroupedEventsTable results={rows}>
          {(eventResults) => <DataTable rows={eventResults} config={mixedRecordsConfig} />}
        </GroupedEventsTable>
      );

    case 'slim':
      return <SlimRecordsTable results={rows} />;

    case 'separate':
      return (
        <GroupedRankingTypesTable results={rows}>
          {(rankingResults, rankingType) => (
            <DataTable
              rows={rankingResults}
              config={separateRecordsConfig(rankingType)}
            />
          )}
        </GroupedRankingTypesTable>
      );

    case 'history':
      return (
        <GroupedEventsTable results={rows}>
          {(eventResults) => <DataTable rows={eventResults} config={historyConfig(false)} />}
        </GroupedEventsTable>
      );

    case 'mixed history':
      return <DataTable rows={rows} config={historyConfig(true)} />;

    default:
      console.error(`Invalid record table: ${show}`);
      return null;
  }
}
