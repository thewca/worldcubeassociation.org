import React, { useEffect } from 'react';
import {
  Button, Container,
  Grid, Header,
} from 'semantic-ui-react';
import { createConsumer } from '@rails/actioncable';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { events } from '../../../lib/wca-data.js.erb';
import WCAQueryClientProvider from '../../../lib/providers/WCAQueryClientProvider';
import ResultsTable from '../components/ResultsTable';
import { liveUrls } from '../../../lib/requests/routes.js.erb';
import Loading from '../../Requests/Loading';
import getRoundResults from '../api/getRoundResults';

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
    queryKey: `${roundId}-results`,
    queryFn: () => getRoundResults(roundId, competitionId),
  });

  useEffect(() => {
    const cable = createConsumer();

    const subscription = cable.subscriptions.create(
      { channel: 'LiveResultsChannel', round_id: roundId },
      {
        received: (data) => {
          queryClient.setQueryData(`${roundId}-results`, (oldData) => [...oldData, data]);
        },
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [roundId, queryClient, eventId]);

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
