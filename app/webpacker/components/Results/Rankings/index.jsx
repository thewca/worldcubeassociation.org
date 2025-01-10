import React, { useEffect, useMemo, useState } from 'react';
import {
  Button, ButtonGroup, Container, Grid, Segment,
} from 'semantic-ui-react';
import { useQuery } from '@tanstack/react-query';
import RankingsTable from './RankingsTable';
import WCAQueryClientProvider from '../../../lib/providers/WCAQueryClientProvider';
import { getRankings } from '../api/rankings';
import Loading from '../../Requests/Loading';
import { rankingsUrl } from '../../../lib/requests/routes.js.erb';
import ResultsFilter from '../resultsFilter';

export default function Wrapper({
  event, region, year, rankingType, gender,
}) {
  return (
    <WCAQueryClientProvider>
      <Rankings initialEvent={event} initialRegion={region} initialYear={year} initialRankingType={rankingType} initialGender={gender} />
    </WCAQueryClientProvider>
  );
}

export function Rankings({
  initialEvent, initialRegion, initialRankingType, initialGender,
}) {
  const [event, setEvent] = useState(initialEvent);
  const [region, setRegion] = useState(initialRegion ?? 'all');
  const [rankingType, setRankingType] = useState(initialRankingType);
  const [gender, setGender] = useState(initialGender);

  const filterState = useMemo(() => ({
    event,
    setEvent,
    region,
    setRegion,
    rankingType,
    setRankingType,
    gender,
    setGender,
  }), [event, gender, rankingType, region]);

  const { data, isFetching } = useQuery({
    queryKey: ['rankings', event, region, rankingType, gender],
    queryFn: () => getRankings(event, rankingType, region, gender),
  });

  useEffect(() => {
    window.history.replaceState(null, '', rankingsUrl(event, rankingType, region, gender));
  }, [event, region, rankingType, gender]);

  if (isFetching) {
    return <Loading />;
  }

  return (
    <Container>
      <ResultsFilter filterState={filterState} />
      <RankingsTable
        competitionsById={data.competitionsById}
        isAverage={rankingType === 'average'}
        rows={data.rows}
      />
    </Container>
  );
}
