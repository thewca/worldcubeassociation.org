"use client";
import { useCallback, useState } from "react";
import { components } from "@/types/openapi";
import events from "@/lib/wca/data/events";
import useAPI from "@/lib/wca/useAPI";
import { Button, ButtonGroup, Grid, GridItem, Link } from "@chakra-ui/react";
import AttemptsForm from "@/components/live/AttemptsForm";
import LiveResultsTable from "@/components/live/LiveResultsTable";
import LiveUpdatingResultsTable from "@/components/live/LiveUpdatingResultsTable";

function zeroedArrayOfSize(size: number) {
  return Array(size).fill(0);
}

export default function AddResults({
  results,
  eventId,
  roundId,
  competitionId,
  competitors,
}: {
  results: components["schemas"]["LiveResult"][];
  eventId: string;
  roundId: string;
  competitionId: string;
  competitors: components["schemas"]["LiveCompetitor"][];
}) {
  const event = events.byId[eventId];
  const solveCount = event.recommendedFormat.expected_solve_count;

  const [registrationId, setRegistrationId] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<number[]>(
    zeroedArrayOfSize(solveCount),
  );
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const api = useAPI();

  const handleRegistrationIdChange = useCallback(
    (value: number) => {
      setRegistrationId(value);
      const alreadyEnteredResults = results.find(
        (r) => r.registration_id === value,
      );
      if (alreadyEnteredResults) {
        setAttempts(alreadyEnteredResults.attempts.map((a) => a.result));
      } else {
        setAttempts(zeroedArrayOfSize(solveCount));
      }
    },
    [results, solveCount],
  );

  const { mutate: mutateSubmit, isPending: isPendingSubmit } = api.useMutation(
    "post",
    "/v1/competitions/{competitionId}/live/rounds/{roundId}",
    {
      onSuccess: () => {
        setSuccess("Results added successfully!");
        setRegistrationId(null);
        setAttempts(zeroedArrayOfSize(solveCount));
        setError("");

        setTimeout(() => setSuccess(""), 3000);
      },
      onError: () => {
        setError("Failed to submit results. Please try again.");
      },
    },
  );

  const { mutate: mutateUpdate, isPending: isPendingUpdate } = api.useMutation(
    "patch",
    "/v1/competitions/{competitionId}/live/rounds/{roundId}",
    {
      onSuccess: () => {
        setSuccess("Results updated successfully!");
        setRegistrationId(null);
        setAttempts(zeroedArrayOfSize(solveCount));
        setError("");

        setTimeout(() => setSuccess(""), 3000);
      },
      onError: () => {
        setError("Failed to update results. Please try again.");
      },
    },
  );

  const handleAttemptChange = (index: number, value: number) => {
    const newAttempts = [...attempts];
    newAttempts[index] = value;
    setAttempts(newAttempts);
  };

  const handleSubmit = () => {
    if (!registrationId) {
      setError("Please enter a user ID");
      return;
    }

    if (results.find((r) => r.registration_id === registrationId)) {
      mutateUpdate({
        params: {
          path: { competitionId: competitionId, roundId: roundId },
        },
        body: {
          attempts: attempts.map((attempt, index) => ({
            result: attempt,
            attempt_number: index + 1,
          })),
          registration_id: registrationId,
        },
      });
    } else {
      mutateSubmit({
        params: {
          path: { competitionId: competitionId, roundId: roundId },
        },
        body: {
          attempts: attempts.map((attempt, index) => ({
            result: attempt,
            attempt_number: index + 1,
          })),
          registration_id: registrationId,
        },
      });
    }
  };

  return (
    <Grid templateColumns="repeat(16, 1fr)" gap="6">
      <GridItem colSpan={4}>
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
          isPending={isPendingSubmit || isPendingUpdate}
        />
      </GridItem>

      <GridItem colSpan={12}>
        <ButtonGroup float="right">
          <Button asChild>
            <Link
              href={`/competitions/${competitionId}/live/rounds/${roundId}`}
            >
              Results
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/competitions/${competitionId}/edit/registrations`}>
              Add Competitor
            </Link>
          </Button>
          <Button asChild>
            <Link
              href={`/competitions/${competitionId}/live/rounds/${roundId}/pdf`}
            >
              PDF
            </Link>
          </Button>
          <Button asChild>
            <Link
              href={`/competitions/${competitionId}/live/rounds/${roundId}/double-check`}
            >
              Double Check
            </Link>
          </Button>
        </ButtonGroup>
        <LiveUpdatingResultsTable
          results={results}
          eventId={eventId}
          competitors={competitors}
          competitionId={competitionId}
          roundId={Number.parseInt(roundId, 10)}
          title="Current Results"
          isAdmin
        />
      </GridItem>
    </Grid>
  );
}
