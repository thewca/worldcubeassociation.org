"use client";
import { useCallback, useState } from "react";
import { components } from "@/types/openapi";
import useAPI from "@/lib/wca/useAPI";
import { Button, ButtonGroup, Grid, GridItem, Link } from "@chakra-ui/react";
import AttemptsForm from "@/components/live/AttemptsForm";
import { Format } from "@/lib/wca/data/formats";
import { parseActivityCode } from "@/lib/wca/wcif/rounds";
import LiveResultsTable from "@/components/live/LiveResultsTable";
import { applyDiffToLiveResults } from "@/lib/live/applyDiffToLiveResults";
import LiveUpdatingResultsTable from "@/components/live/LiveUpdatingResultsTable";
import { useLiveResults } from "@/providers/LiveResultProvider";
import { LiveResult } from "@/types/live";
function zeroedArrayOfSize(size: number) {
  return Array(size).fill(0);
}

export default function AddResults({
  format,
  roundId,
  competitionId,
  competitors,
}: {
  format: Format;
  roundId: string;
  competitionId: string;
  competitors: components["schemas"]["LiveCompetitor"][];
}) {
  const eventId = parseActivityCode(roundId).eventId;

  const solveCount = format.expected_solve_count;

  const [registrationId, setRegistrationId] = useState<number>();
  const [attempts, setAttempts] = useState<number[]>(
    zeroedArrayOfSize(solveCount),
  );
  const [pendingResults, updatePendingResults] = useState<LiveResult[]>([]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { liveResults } = useLiveResults();

  const api = useAPI();
  const handleRegistrationIdChange = useCallback(
    (value: number) => {
      setRegistrationId(value);
      const alreadyEnteredResults = liveResults.find(
        (r) => r.registration_id === value,
      );
      if (alreadyEnteredResults) {
        setAttempts(alreadyEnteredResults.attempts.map((a) => a.value));
      } else {
        setAttempts(zeroedArrayOfSize(solveCount));
      }
    },
    [liveResults, solveCount],
  );

  const { mutate: mutateUpdate, isPending: isPendingUpdate } = api.useMutation(
    "patch",
    "/v1/competitions/{competitionId}/live/rounds/{roundId}",
    {
      onSuccess: (_data, variables) => {
        // Insert Updates as pending that get overwritten by the actual WebSocket
        updatePendingResults((results) =>
          applyDiffToLiveResults(
            results,
            [],
            [
              {
                registration_id: variables.body.registration_id,
                live_attempts: variables.body.attempts,
                advancing: false,
                advancing_questionable: false,
                average: 0,
                best: 0,
                average_record_tag: "",
                single_record_tag: "",
              },
            ],
            [],
          ),
        );
        setSuccess("Results updated successfully!");
        setRegistrationId(undefined);
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

    mutateUpdate({
      params: {
        path: { competitionId: competitionId, roundId: roundId },
      },
      body: {
        attempts: attempts.map((attempt, index) => ({
          value: attempt,
          attempt_number: index + 1,
        })),
        registration_id: registrationId,
      },
    });
  };

  return (
    <Grid templateColumns="repeat(16, 1fr)" gap="6">
      <GridItem colSpan={4}>
        <AttemptsForm
          error={error}
          success={success}
          handleAttemptChange={handleAttemptChange}
          handleSubmit={handleSubmit}
          handleRegistrationIdChange={handleRegistrationIdChange}
          header="Add Result"
          attempts={attempts}
          competitors={competitors}
          solveCount={solveCount}
          eventId={eventId}
          isPending={isPendingUpdate}
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
        {pendingResults.length > 0 && (
          <LiveResultsTable
            results={pendingResults}
            eventId={eventId}
            formatId={format.id}
            competitionId={competitionId}
            competitors={competitors}
          />
        )}
        <LiveUpdatingResultsTable
          eventId={eventId}
          formatId={format.id}
          competitionId={competitionId}
          competitors={competitors}
          isAdmin
          title=""
        />
      </GridItem>
    </Grid>
  );
}
