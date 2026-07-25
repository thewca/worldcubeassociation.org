"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from "react";
import formats from "@/lib/wca/data/formats";
import { useLiveResults } from "@/providers/LiveResultProvider";
import useAPI from "@/lib/wca/useAPI";
import { Toaster, toaster } from "@/components/ui/toaster";
import { applyCutoff, applyTimeLimit } from "@/lib/live/attempt-result";
import { padSkipped } from "@/lib/live/padSkipped";
import { LiveAttempt, LiveCompetitor } from "@/types/live";
import { useRoundInfo } from "@/providers/RoundInfoProvider";
import { components } from "@/types/openapi";
import useStoredState from "@/lib/hooks/useStoredState";

type BatchEntry = components["schemas"]["SubmitLiveResult"];

interface AdminResultsContextValue {
  registrationId: number | undefined;
  attempts: number[];
  isPending: boolean;
  batchMode: boolean;
  setBatchMode: (value: boolean) => void;
  batchCount: number;
  // Staged (not-yet-submitted) attempts per competitor, so their result row
  // can preview them in a muted colour.
  batchAttemptsByRegistrationId: Map<number, LiveAttempt[]>;
  removeFromBatch: (registrationId: number) => void;
  submitBatch: () => void;
  handleRegistrationIdChange: (value?: number) => void;
  handleAttemptChange: (index: number, value: number) => void;
  handleSubmit: (onSuccess: () => void) => void;
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
  clearOnSubmit = true,
}: {
  children: ReactNode;
  competitionId: string;
  initialRegistrationId?: number;
  // Double-check stays on the current competitor after submitting, so it opts out of clearing.
  clearOnSubmit?: boolean;
}) {
  const { id: roundId, cutoff, timeLimit, format: formatId } = useRoundInfo();
  const format = formats.byId[formatId];

  const { liveResultsByRegistrationId, addPendingLiveResult, competitors } =
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
        return padSkipped(competitorResults.attempts, solveCount).map(
          (a) => a.value,
        );
      }

      return zeroedArrayOfSize(solveCount);
    },
    [liveResultsByRegistrationId, solveCount],
  );

  const [attempts, setAttempts] = useState<number[]>(() =>
    getAttemptsForCompetitor(initialRegistrationId),
  );

  const api = useAPI();

  const [batchModeEnabled, setBatchModeEnabled] = useState(false);
  // Persisted to localStorage so staged results survive a refresh/crash — the
  // whole point of batch mode is unreliable connections. Cleared on submit.
  const [storedBatch, setBatch] = useStoredState<BatchEntry[]>(
    [],
    `live-batch-${roundId}`,
  );

  // Quitting removes a competitor from the round, so their staged results drop
  // out of the batch. `competitors` is kept up to date by the websocket
  // subscription, so this also covers quits from other devices.
  const batch = useMemo(
    () => storedBatch.filter((e) => competitors.has(e.registration_id)),
    [storedBatch, competitors],
  );

  // Stay in batch mode while staged results exist, so they can't be left behind
  // and accidentally submitted later. Exiting must clear the batch (see setBatchMode).
  const batchMode = batchModeEnabled || batch.length > 0;

  const setBatchMode = useCallback(
    (value: boolean) => {
      setBatchModeEnabled(value);
      if (!value) setBatch([]);
    },
    [setBatch],
  );

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
        if (clearOnSubmit) {
          setRegistrationId(undefined);
          setAttempts(zeroedArrayOfSize(solveCount));
        }
      },
      onError: () => {
        toaster.create({
          description: "Failed to enqueue results",
          type: "error",
        });
      },
    },
  );

  const { mutate: mutateBatch, isPending: isPendingBatch } = api.useMutation(
    "post",
    "/v1/competitions/{competitionId}/live/rounds/{roundId}/batch",
    {
      onSuccess: (_data, variables) => {
        variables.body.results.forEach((entry) =>
          addPendingLiveResult(entry, roundId),
        );
        setBatch([]);
        toaster.create({
          description: "Batch queued",
          type: "success",
        });
      },
      onError: () => {
        toaster.create({
          description: "Failed to enqueue batch",
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

  const handleSubmit = (onSuccess: () => void) => {
    if (!registrationId) {
      toaster.create({
        description: "Please enter a user id",
        type: "error",
      });
      return;
    }

    const body = {
      attempts: attempts
        .map((attempt, index) => ({
          value: attempt,
          attempt_number: index + 1,
        }))
        // Preserve the original attempt_numbers even when there were gaps in the attempts
        .filter((a) => a.value !== 0),
      registration_id: registrationId,
    };

    if (batchMode) {
      // Stage locally; nothing hits the server until "Submit Batch" is clicked.
      setBatch((prev) => [
        ...prev.filter((e) => e.registration_id !== registrationId),
        body,
      ]);
      setRegistrationId(undefined);
      setAttempts(zeroedArrayOfSize(solveCount));
      onSuccess();
      return;
    }

    mutateUpdate(
      {
        params: {
          path: { competitionId, roundId },
        },
        body,
      },
      { onSuccess },
    );
  };

  const removeFromBatch = useCallback(
    (toRemoveId: number) => {
      setBatch((prev) => prev.filter((e) => e.registration_id !== toRemoveId));
    },
    [setBatch],
  );

  const submitBatch = () => {
    if (batch.length === 0) return;

    mutateBatch({
      params: {
        path: { competitionId, roundId },
      },
      body: { results: batch },
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
          isPendingUpdate ||
          isPendingClear ||
          isPendingQuit ||
          isPendingAdd ||
          isPendingBatch,
        batchMode,
        setBatchMode,
        batchCount: batch.length,
        batchAttemptsByRegistrationId: new Map(
          batch.map((e) => [e.registration_id, e.attempts]),
        ),
        removeFromBatch,
        submitBatch,
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

// Null outside an admin provider (e.g. the public results table reuses LiveResultsTable).
export function useResultsAdminOptional(): AdminResultsContextValue | null {
  return useContext(AdminResultsContext);
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
