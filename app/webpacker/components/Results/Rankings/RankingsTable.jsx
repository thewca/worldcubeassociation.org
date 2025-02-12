import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getRankings } from '../api/rankings';
import Loading from '../../Requests/Loading';
import DataTable from '../DataTable';
import { mapRankingsData, rankingsConfig } from './utils';

export default function RankingsTable({ filterState }) {
  const {
    event, region, rankingType, gender, show,
  } = filterState;

  const isAverage = rankingType === 'average';

  const { data: rows, isLoading } = useQuery({
    queryKey: ['rankings', event, region, rankingType, gender, show],
    queryFn: () => getRankings(event, rankingType, region, gender, show),
    select: (rankingsData) => mapRankingsData(rankingsData, show === 'by region'),
  });

  if (isLoading) return <Loading />;

  return (
    <DataTable rows={rows} config={rankingsConfig(show, isAverage)} />
  );
}
