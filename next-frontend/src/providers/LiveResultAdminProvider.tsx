"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  ReactNode,
} from "react";
import formats from "@/lib/wca/data/formats";
import { useLiveResults } from "@/providers/LiveResultProvider";
import useAPI from "@/lib/wca/useAPI";
import { Toaster, toaster } from "@/components/ui/toaster";
import { applyCutoff, applyTimeLimit } from "@/lib/live/attempt-result";
import { LiveCompetitor, LiveRoundAdminBase } from "@/types/live";

interface AdminResultsContextValue {
  registrationId: number | undefined;
  attempts: number[];
  isPending: boolean;
  handleRegistrationIdChange: (value?: number) => void;
  handleAttemptChange: (index: number, value: number) => void;
  handleSubmit: () => void;
  clearCompetitorsResults: (registrationId: number) => void;
  quitCompetitor: (
    registrationId: number,
    advanceNext: boolean,
    toAdvance: LiveCompetitor[],
  ) => void;
  addCompetitorToRound: (registrationId: number) => Promise<void>;
}

function zeroedArrayOfSize(size: number) {
  return Array(size).fill(0);
}

const AdminResultsContext = createContext<AdminResultsContextValue | null>(
  null,
);

export function LiveResultAdminProvider({
  children,
  competitionId,
  initialRegistrationId,
  round,
}: {
  children: ReactNode;
  competitionId: string;
  initialRegistrationId?: number;
  round: LiveRoundAdminBase;
}) {
  const { id: roundId, cutoff, timeLimit, format: formatId } = round;
  const format = formats.byId[formatId];

  const { liveResultsByRegistrationId, addPendingLiveResult } =
    useLiveResults();

  const solveCount = format.expected_solve_count;

  const [registrationId, setRegistrationId] = useState<number | undefined>(
    initialRegistrationId,
  );

  const getAttemptsForCompetitor = useCallback(
    (registrationId?: number): number[] => {
      if (registrationId === undefined) {
        return zeroedArrayOfSize(solveCount);
      }

      // Even for Dual Rounds we only fetch one round in the admin view
      const competitorResults = liveResultsByRegistrationId[registrationId][0];

      if (competitorResults.attempts.length > 0) {
        return competitorResults.attempts
          .toSorted((a, b) => a.attempt_number - b.attempt_number)
          .map((a) => a.value);
      }

      return zeroedArrayOfSize(solveCount);
    },
    [liveResultsByRegistrationId, solveCount],
  );

  const [attempts, setAttempts] = useState<number[]>(() =>
    getAttemptsForCompetitor(initialRegistrationId),
  );

  const api = useAPI();

  const handleRegistrationIdChange = useCallback(
    (value?: number) => {
      setRegistrationId(value);

      const competitorAttempts = getAttemptsForCompetitor(value);
      setAttempts(competitorAttempts);
    },
    [getAttemptsForCompetitor],
  );

  const { mutate: mutateUpdate, isPending: isPendingUpdate } = api.useMutation(
    "patch",
    "/v1/competitions/{competitionId}/live/rounds/{roundId}",
    {
      onSuccess: (_data, variables) => {
        addPendingLiveResult(variables.body, roundId);
        toaster.create({
          description: "Results updated queued",
          type: "success",
        });
        setRegistrationId(undefined);
        setAttempts(zeroedArrayOfSize(solveCount));
      },
      onError: () => {
        toaster.create({
          description: "Failed to enqueue results",
          type: "error",
        });
      },
    },
  );

  const { mutateAsync: addCompetitorMutation, isPending: isPendingAdd } =
    api.useMutation(
      "put",
      "/v1/competitions/{competitionId}/live/rounds/{roundId}/{registrationId}",
      {
        onSuccess: () => {
          toaster.create({
            description: "Successfully added competitor",
            type: "success",
          });
        },
        onError: () => {
          toaster.create({
            description: "Failed to add competitor",
            type: "error",
          });
        },
      },
    );

  const addCompetitorToRound = useCallback(
    async (registrationId: number) => {
      await addCompetitorMutation({
        params: {
          path: {
            registrationId,
            competitionId,
            roundId,
          },
        },
      });
    },
    [addCompetitorMutation, competitionId, roundId],
  );

  const { mutate: mutateQuit, isPending: isPendingQuit } = api.useMutation(
    "delete",
    "/v1/competitions/{competitionId}/live/rounds/{roundId}/{registrationId}",
    {
      onSuccess: () => {
        toaster.create({
          description: "Successfully quit competitor",
          type: "success",
        });
      },
      onError: () => {
        toaster.create({
          description: "Failed to quit competitor",
          type: "error",
        });
      },
    },
  );

  const { mutate: mutateClear, isPending: isPendingClear } = api.useMutation(
    "put",
    "/v1/competitions/{competitionId}/live/rounds/{roundId}/{registrationId}/clear",
    {
      onSuccess: () => {
        toaster.create({
          description: "Successfully cleared competitor",
          type: "success",
        });
      },
      onError: () => {
        toaster.create({
          description: "Failed to clear competitor",
          type: "error",
        });
      },
    },
  );

  const handleAttemptChange = (index: number, value: number) => {
    const newAttempts = [...attempts];
    newAttempts[index] = value;
    setAttempts(applyCutoff(applyTimeLimit(newAttempts, timeLimit), cutoff));
  };

  const handleSubmit = () => {
    if (!registrationId) {
      toaster.create({
        description: "Please enter a user id",
        type: "error",
      });
      return;
    }

    mutateUpdate({
      params: {
        path: { competitionId, roundId },
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

  const clearCompetitorsResults = (toClearId: number) => {
    mutateClear({
      params: {
        path: { competitionId, roundId, registrationId: toClearId },
      },
    });
    if (registrationId === toClearId) {
      setAttempts(zeroedArrayOfSize(solveCount));
    }
  };

  const quitCompetitor = (
    registrationId: number,
    advanceNext: boolean,
    toAdvance: LiveCompetitor[],
  ) => {
    mutateQuit({
      params: {
        path: { competitionId, roundId, registrationId },
      },
      body: {
        advancing_ids: advanceNext ? toAdvance.map((r) => r.id) : [],
      },
    });
  };

  return (
    <AdminResultsContext.Provider
      value={{
        registrationId,
        attempts,
        isPending:
          isPendingUpdate || isPendingClear || isPendingQuit || isPendingAdd,
        quitCompetitor,
        handleRegistrationIdChange,
        handleAttemptChange,
        handleSubmit,
        addCompetitorToRound,
        clearCompetitorsResults,
      }}
    >
      {children}
      <Toaster />
    </AdminResultsContext.Provider>
  );
}

export function useResultsAdmin(): AdminResultsContextValue {
  const context = useContext(AdminResultsContext);
  if (!context) {
    throw new Error(
      "useAdminResults must be used within an AdminResultsProvider",
    );
  }
  return context;
}
