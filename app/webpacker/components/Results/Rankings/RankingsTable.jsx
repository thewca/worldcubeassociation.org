import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getRankings } from '../api/rankings';
import Loading from '../../Requests/Loading';
import DataTable from '../DataTable';
import {
  attemptResultColumn,
  competitionColumn,
  personColumn,
  rankColumn,
  regionColumn,
  representingColumn,
  resultsFiveWideColumn,
} from '../TableColumns';
import { mapRankingsData } from './utils';

export default function RankingsTable({ filterState }) {
  const {
    event, region, rankingType, gender, show,
  } = filterState;

  const isAverage = rankingType === 'average';

  const { data, isFetching } = useQuery({
    queryKey: ['rankings', event, region, rankingType, gender, show],
    queryFn: () => getRankings(event, rankingType, region, gender, show),
    select: (rankingsData) => mapRankingsData(rankingsData, show === 'by region'),
  });

  const columns = useMemo(() => [
    show === 'by region' ? regionColumn : rankColumn,
    personColumn,
    attemptResultColumn,
    show !== 'by region' && representingColumn,
    competitionColumn,
    isAverage && resultsFiveWideColumn,
  ].filter(Boolean), [show, isAverage]);

  if (isFetching) return <Loading />;

  return (
    <DataTable rows={data} config={columns} />
  );
}
