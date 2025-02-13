import React, { useCallback } from 'react';
import {
  Button, Container,
  Grid, Header,
} from 'semantic-ui-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { events } from '../../../lib/wca-data.js.erb';
import WCAQueryClientProvider from '../../../lib/providers/WCAQueryClientProvider';
import ResultsTable from '../components/ResultsTable';
import { liveUrls } from '../../../lib/requests/routes.js.erb';
import Loading from '../../Requests/Loading';
import getRoundResults, { insertNewResult, roundResultsKey } from '../api/getRoundResults';
import useResultsSubscription from '../hooks/useResultsSubscription';

export default function Wrapper({
  roundId, eventId, competitionId, competitors, canAdminResults,
}) {
  return (
    <WCAQueryClientProvider>
      <ResultPage
        competitionId={competitionId}
        roundId={roundId}
        eventId={eventId}
        competitors={competitors}
        canAdminResults={canAdminResults}
      />
    </WCAQueryClientProvider>
  );
}

function ResultPage({
  canAdminResults,
  competitionId, roundId, eventId, competitors,
}) {
  const queryClient = useQueryClient();

  const { data: results, isLoading } = useQuery({
    queryKey: roundResultsKey(roundId),
    queryFn: () => getRoundResults(roundId, competitionId),
  });

  const updateResults = useCallback((data) => {
    queryClient.setQueryData(
      roundResultsKey(roundId),
      (oldData) => insertNewResult(oldData, data),
    );
  }, [roundId, queryClient]);

  useResultsSubscription(roundId, updateResults);

  const event = events.byId[eventId];

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Container fluid>
      <Header>
        {event.name}
        {canAdminResults && <a href={liveUrls.roundResultsAdmin(competitionId, roundId)}><Button floated="right">Admin</Button></a>}
      </Header>
      <Grid>
        <Grid.Column width={16}>
          <ResultsTable
            results={results ?? []}
            event={event}
            competitors={competitors}
            competitionId={competitionId}
          />
        </Grid.Column>
      </Grid>
    </Container>
  );
}
