import React, { useEffect, useState } from 'react';
import {
  Button, ButtonGroup, Container, Grid, Segment,
} from 'semantic-ui-react';
import { useQuery } from '@tanstack/react-query';
import RankingsTable from './RankingsTable';
import WCAQueryClientProvider from '../../../lib/providers/WCAQueryClientProvider';
import { getRankings } from '../api/rankings';
import { EventSelector } from '../../wca/EventSelector';
import { RegionSelector } from '../../CompetitionsOverview/CompetitionsFilters';
import Loading from '../../Requests/Loading';
import { rankingsUrl } from '../../../lib/requests/routes.js.erb';

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
  initialEvent, initialRegion, initialYear, initialRankingType, initialGender,
}) {
  const [event, setEvent] = useState(initialEvent);
  const [region, setRegion] = useState(initialRegion ?? 'all');
  const [year, setYear] = useState(initialYear);
  const [rankingType, setRankingType] = useState(initialRankingType);
  const [gender, setGender] = useState(initialGender);

  const { data, isFetching } = useQuery({
    queryKey: ['rankings', event, region, year, rankingType],
    queryFn: () => getRankings(event, rankingType, year, region),
  });

  useEffect(() => {
    const queryParams = new URLSearchParams();

    if (region !== 'all') {
      queryParams.append('region', region);
    }
    if (year) {
      queryParams.append('years', `only ${year}`);
    }
    if (rankingType === 'average') {
      queryParams.append('gender', gender); // Replace with dynamic values if needed
    }

    const newUrl = `${rankingsUrl(event, rankingType)}?${queryParams.toString()}`;
    window.history.replaceState(null, '', newUrl);
  }, [event, region, year, rankingType, gender]);

  if (isFetching) {
    return <Loading />;
  }

  return (
    <Container>
      <Grid>
        <Grid.Row columns={1}>
          <EventSelector selectedEvents={[event]} onEventSelection={({ eventId }) => setEvent(eventId)} showLabels={false} />
          <RegionSelector region={region} dispatchFilter={({ region: r }) => setRegion(r)} />
        </Grid.Row>
        <Grid.Row columns={1}>
          <ButtonGroup>
            <Button onClick={() => setRankingType('single')}>Single</Button>
            <Button onClick={() => setGender('average')}>Average</Button>
          </ButtonGroup>
          <ButtonGroup>
            <Button>All years</Button>
          </ButtonGroup>
          <ButtonGroup>
            <Button onClick={() => setGender('All')}>All</Button>
            <Button onClick={() => setGender('Male')}>Male</Button>
            <Button onClick={() => setGender('Female')}>Female</Button>
          </ButtonGroup>
          <ButtonGroup>
            <Button>100 persons</Button>
            <Button>Results</Button>
            <Button>By Region</Button>
          </ButtonGroup>
        </Grid.Row>
      </Grid>
      <RankingsTable
        competitionsById={data.competitionsById}
        isAverage={rankingType === 'average'}
        rows={data.rows}
      />
    </Container>
  );
}
