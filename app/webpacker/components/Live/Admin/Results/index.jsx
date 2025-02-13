import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid, Button, Header, Segment,
} from 'semantic-ui-react';
import { createConsumer } from '@rails/actioncable';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { events } from '../../../../lib/wca-data.js.erb';
import WCAQueryClientProvider from '../../../../lib/providers/WCAQueryClientProvider';
import ResultsTable from '../../components/ResultsTable';
import getRoundResults from '../../api/getRoundResults';
import submitRoundResults from '../../api/submitRoundResults';
import updateRoundResults from '../../api/updateRoundResults';
import { competitionEditRegistrationsUrl, liveUrls } from '../../../../lib/requests/routes.js.erb';
import AttemptsForm from '../../components/AttemptsForm';
import useResultsSubscription from "../../hooks/useResultsSubscription";

export default function Wrapper({
  roundId, eventId, competitionId, competitors,
}) {
  return (
    <WCAQueryClientProvider>
      <AddResults
        competitionId={competitionId}
        roundId={roundId}
        eventId={eventId}
        competitors={competitors}
      />
    </WCAQueryClientProvider>
  );
}

function zeroedArrayOfSize(size) {
  return Array(size).fill(0);
}

function AddResults({
  competitionId, roundId, eventId, competitors,
}) {
  const event = events.byId[eventId];
  const solveCount = event.recommendedFormat().expectedSolveCount;
  const [registrationId, setRegistrationId] = useState('');
  const [attempts, setAttempts] = useState(zeroedArrayOfSize(solveCount));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const queryClient = useQueryClient();

  const { data: results, isLoading } = useQuery({
    queryKey: [roundId, 'results'],
    queryFn: () => getRoundResults(roundId, competitionId),
  });

  const handleRegistrationIdChange = useCallback((_, { value }) => {
    setRegistrationId(value);
    const alreadyEnteredResults = results.find((r) => r.registration_id === value);
    if (alreadyEnteredResults) {
      setAttempts(alreadyEnteredResults.attempts.map((a) => a.result));
    } else {
      setAttempts(zeroedArrayOfSize(solveCount));
    }
  }, [results, solveCount]);

  const {
    mutate: mutateSubmit, isPending: isPendingSubmit,
  } = useMutation({
    mutationFn: submitRoundResults,
    onSuccess: () => {
      setSuccess('Results added successfully!');
      setRegistrationId('');
      setAttempts(zeroedArrayOfSize(solveCount));
      setError('');

      setTimeout(() => setSuccess(''), 3000);
    },
    onError: () => {
      setError('Failed to submit results. Please try again.');
    },
  });

  const {
    mutate: mutateUpdate, isPending: isPendingUpdate,
  } = useMutation({
    mutationFn: updateRoundResults,
    onSuccess: () => {
      setSuccess('Results added successfully!');
      setRegistrationId('');
      setAttempts(zeroedArrayOfSize(solveCount));
      setError('');

      setTimeout(() => setSuccess(''), 3000);
    },
    onError: () => {
      setError('Failed to submit results. Please try again.');
    },
  });

  const updateResultsData = useCallback((data) => {
    queryClient.setQueryData([roundId, 'results'], (oldData) => {
      const existingIndex = oldData.map((a) => a.registration_id)
        .indexOf(data.registration_id);
      if (existingIndex === -1) {
        return [...oldData, data];
      }
      return oldData.map((a) => (a.registration_id === data.registration_id ? data : a));
    });
  }, [queryClient, roundId]);

  useResultsSubscription(roundId, updateResultsData);

  const handleAttemptChange = (index, value) => {
    const newAttempts = [...attempts];
    newAttempts[index] = value;
    setAttempts(newAttempts);
  };

  const handleSubmit = async () => {
    if (!registrationId) {
      setError('Please enter a user ID');
      return;
    }

    if (results.find((r) => r.registration_id === registrationId)) {
      mutateUpdate({
        roundId, registrationId, competitionId, attempts,
      });
    } else {
      mutateSubmit({
        roundId, registrationId, competitionId, attempts,
      });
    }
  };

  return (
    <Segment loading={isLoading || isPendingSubmit || isPendingUpdate}>
      <Grid>
        <Grid.Column width={4}>
          <AttemptsForm
            error={error}
            success={success}
            registrationId={registrationId}
            handleAttemptChange={handleAttemptChange}
            handleSubmit={handleSubmit}
            handleRegistrationIdChange={handleRegistrationIdChange}
            header="Add Result"
            attempts={attempts}
            competitors={competitors}
            solveCount={solveCount}
            eventId={eventId}
          />
        </Grid.Column>

        <Grid.Column width={12}>
          <Button.Group floated="right">
            <a href={liveUrls.roundResults(competitionId, roundId)}>
              <Button>Results</Button>
            </a>
            <a href={competitionEditRegistrationsUrl(competitionId)}>
              <Button>Add Competitor</Button>
            </a>
            <a href={liveUrls.roundResults(competitionId, roundId)}>
              <Button>PDF</Button>
            </a>
            <a href={liveUrls.checkRoundResultsAdmin(competitionId, roundId)}>
              <Button>Double Check</Button>
            </a>
          </Button.Group>
          <Header>Live Results</Header>
          <ResultsTable
            results={results ?? []}
            event={event}
            competitors={competitors}
            competitionId={competitionId}
            isAdmin
          />
        </Grid.Column>
      </Grid>
    </Segment>
  );
}
