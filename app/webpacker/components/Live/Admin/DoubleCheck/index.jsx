import React, {
  useMemo, useState,
} from 'react';
import {
  Button, Card,
  Grid, Message,
  Segment,
} from 'semantic-ui-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { events } from '../../../../lib/wca-data.js.erb';
import WCAQueryClientProvider from '../../../../lib/providers/WCAQueryClientProvider';
import updateRoundResults from '../../api/updateRoundResults';
import getRoundResults, { roundResultsKey } from '../../api/getRoundResults';
import Loading from '../../../Requests/Loading';
import AttemptsForm from '../../components/AttemptsForm';

export default function Wrapper({
  competitionId, competitors, round,
}) {
  if (competitors.length === 0) {
    return (
      <Message negative>
        No Results entered yet
      </Message>
    );
  }

  return (
    <WCAQueryClientProvider>
      <DoubleCheck
        competitionId={competitionId}
        competitors={competitors}
        round={round}
      />
    </WCAQueryClientProvider>
  );
}

function DoubleCheck({
  competitionId, competitors, round,
}) {
  const event = events.byId[round.event_id];
  const solveCount = event.recommendedFormat().expectedSolveCount;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [registrationId, setRegistrationId] = useState(competitors[0].id);
  const [attempts, setAttempts] = useState(_.times(solveCount, _.constant(0)));

  const { data: results, isLoading } = useQuery({
    queryKey: roundResultsKey(round.id),
    queryFn: () => getRoundResults(round.id, competitionId),
  });

  const {
    mutate: mutateUpdate, isPending: isPendingUpdate,
  } = useMutation({
    mutationFn: updateRoundResults,
  });

  const handleSubmit = async () => {
    mutateUpdate({
      roundId: round.id, registrationId, competitionId, attempts,
    });
  };

  const handleAttemptChange = (index, value) => {
    const newAttempts = [...attempts];
    newAttempts[index] = value;
    setAttempts(newAttempts);
  };

  const handleRegistrationIdChange = (_, { value }) => {
    setRegistrationId(value);
  };

  const currentCompetitor = useMemo(() => {
    if (results) {
      return competitors.find((r) => r.id === results[currentIndex].registration_id);
    }
    return {};
  }, [competitors, currentIndex, results]);

  const onPrevious = () => {
    setAttempts(results[currentIndex - 1].attempts.map((a) => a.result));
    setCurrentIndex((oldIndex) => oldIndex - 1);
  };

  const onNext = () => {
    setAttempts(results[currentIndex + 1].attempts.map((a) => a.result));
    setCurrentIndex((oldIndex) => oldIndex + 1);
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Grid>
      <Grid.Column width={1} verticalAlign="middle">
        { currentIndex !== 0 && <Button onClick={onPrevious}>{'<'}</Button>}
      </Grid.Column>
      <Grid.Column width={7}>
        <Segment loading={isPendingUpdate}>
          <AttemptsForm
            registrationId={currentCompetitor.id}
            handleAttemptChange={handleAttemptChange}
            handleSubmit={handleSubmit}
            handleRegistrationIdChange={handleRegistrationIdChange}
            header="Double Check Result"
            attempts={attempts}
            competitors={competitors}
            solveCount={solveCount}
            eventId={round.event_id}
          />
        </Segment>
      </Grid.Column>
      <Grid.Column width={1} verticalAlign="middle">
        {currentIndex !== results.length - 1 && <Button onClick={onNext}>{'>'}</Button>}
      </Grid.Column>
      <Grid.Column textAlign="center" width={7} verticalAlign="middle">
        <Card fluid raised>
          <Card.Header>
            {currentIndex + 1}
            {' '}
            of
            {' '}
            {results.length}
            <br />
            {round.name}
          </Card.Header>
          <Card.Content>
            Double-check
          </Card.Content>
          <Card.Description>
            Here you can iterate over results ordered by entry time (newest first).
            When doing double-check you can place a
            scorecard next to the form to quickly compare attempt results.
            For optimal experience make sure to always put
            entered/updated scorecard at the top of the pile.
          </Card.Description>
        </Card>
      </Grid.Column>
    </Grid>
  );
}
