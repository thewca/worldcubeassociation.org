import { useQuery } from '@tanstack/react-query';
import { Segment } from 'semantic-ui-react';
import React from 'react';
import { getRecords } from '../api/records';
import Loading from '../../Requests/Loading';
import MixedRecordsTables from './MixedRecordsTables';
import SlimRecordTable from './SlimRecordsTable';
import HistoryRecordsTables from './HistoryRecordsTables';
import MixedHistoryRecordsTable from './MixedHistoryRecordsTable';
import { augmentApiResults } from './utils';
import GroupedEventsTable from './GroupedEventsTable';
import GroupedRankingTypesTable from './GroupedRankingTypesTable';
import RankingTypeTable from './RankingTypeTable';

export default function RecordsTable({ filterState }) {
  const {
    event, region, gender, show,
  } = filterState;

  const { data: rows, isFetching } = useQuery({
    queryKey: ['records', event, region, gender, show],
    queryFn: () => getRecords(event, region, gender, show),
    select: (recordsData) => augmentApiResults(recordsData, show),
  });

  if (isFetching) {
    return <Loading />;
  }

  if (rows.length === 0) {
    return <Segment>No results found</Segment>;
  }

  switch (show) {
    case 'mixed':
      return (
        <GroupedEventsTable results={rows}>
          {(eventResults) => <MixedRecordsTables results={eventResults} />}
        </GroupedEventsTable>
      );

    case 'slim':
      return <SlimRecordTable results={rows} />;

    case 'separate':
      return (
        <GroupedRankingTypesTable results={rows}>
          {(rankingResults, rankingType) => (
            <RankingTypeTable
              results={rankingResults}
              rankingType={rankingType}
            />
          )}
        </GroupedRankingTypesTable>
      );

    case 'history':
      return (
        <GroupedEventsTable results={rows}>
          {(eventResults) => <HistoryRecordsTables results={eventResults} />}
        </GroupedEventsTable>
      );

    case 'mixed history':
      return <MixedHistoryRecordsTable results={rows} />;

    default:
      console.error(`Invalid record table: ${show}`);
      return null;
  }
}
