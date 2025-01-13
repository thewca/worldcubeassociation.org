import React, { useEffect, useMemo, useState } from 'react';
import { Container } from 'semantic-ui-react';
import { useQuery } from '@tanstack/react-query';
import RankingsTable from './RankingsTable';
import WCAQueryClientProvider from '../../../lib/providers/WCAQueryClientProvider';
import { getRankings } from '../api/rankings';
import Loading from '../../Requests/Loading';
import { rankingsUrl } from '../../../lib/requests/routes.js.erb';
import ResultsFilter from '../resultsFilter';

export default function Wrapper({
  event, region, year, rankingType, gender, show,
}) {
  return (
    <WCAQueryClientProvider>
      <Rankings
        initialEvent={event}
        initialRegion={region}
        initialYear={year}
        initialRankingType={rankingType}
        initialGender={gender}
        initialShow={show}
      />
    </WCAQueryClientProvider>
  );
}

export function Rankings({
  initialEvent, initialRegion, initialRankingType, initialGender, initialShow,
}) {
  const [event, setEvent] = useState(initialEvent);
  const [region, setRegion] = useState(initialRegion ?? 'all');
  const [rankingType, setRankingType] = useState(initialRankingType);
  const [gender, setGender] = useState(initialGender);
  const [show, setShow] = useState(initialShow ?? 'Persons');

  const filterState = useMemo(() => ({
    event,
    setEvent,
    region,
    setRegion,
    rankingType,
    setRankingType,
    gender,
    setGender,
    show,
    setShow,
  }), [event, gender, rankingType, region, show]);

  const { data, isFetching } = useQuery({
    queryKey: ['rankings', event, region, rankingType, gender, show],
    queryFn: () => getRankings(event, rankingType, region, gender, show),
  });

  useEffect(() => {
    window.history.replaceState(null, '', rankingsUrl(event, rankingType, region, gender, show));
  }, [event, region, rankingType, gender, show]);

  if (isFetching) {
    return <Loading />;
  }

  return (
    <Container fluid>
      <ResultsFilter filterState={filterState} />
      <RankingsTable
        competitionsById={data.competitionsById}
        isAverage={rankingType === 'average'}
        rows={data.rows}
        show={show}
      />
    </Container>
  );
}
