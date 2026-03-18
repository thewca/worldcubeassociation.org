"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import {
  LiveAttempt,
  LiveCompetitor,
  LiveResult,
  LiveRound,
  PendingLiveResult,
} from "@/types/live";
import useAPI from "@/lib/wca/useAPI";
import useResultsSubscriptions, {
  ConnectionState,
  DiffedLiveResult,
  DiffProtocolResponse,
} from "@/lib/hooks/useResultsSubscription";
import { applyDiffToLiveResults } from "@/lib/live/applyDiffToLiveResults";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import _ from "lodash";
import {
  decompressFullResult,
  decompressPartialResult,
} from "@/lib/live/decompressDiff";

export type LiveResultsByRegistrationId = Record<string, LiveResult[]>;
interface LiveResultContextType {
  liveResultsByRegistrationId: LiveResultsByRegistrationId;
  addPendingLiveResult: (
    liveResult: PendingLiveResult,
    roundWcifId: string,
  ) => void;
  pendingLiveResults: LiveResult[];
  addPendingQuitCompetitor: (registrationId: number) => void;
  pendingQuitCompetitors: Set<number>;
  connectionState: ConnectionState;
  competitors: Map<number, LiveCompetitor>;
}

const LiveResultContext = createContext<LiveResultContextType | undefined>(
  undefined,
);

const toOrderedAttemptValues = (attempts: LiveAttempt[]) =>
  attempts
    .toSorted((a, b) => a.attempt_number - b.attempt_number)
    .map((att) => att.value);

const compareAttempts = (
  attemptsA: LiveAttempt[],
  attemptsB: LiveAttempt[],
) => {
  const sortedValuesA = toOrderedAttemptValues(attemptsA);
  const sortedValuesB = toOrderedAttemptValues(attemptsB);

  return (
    sortedValuesA.length === sortedValuesB.length &&
    sortedValuesA.every((value, index) => value === sortedValuesB[index])
  );
};

export function LiveResultProvider({
  initialRound,
  competitionId,
  children,
}: {
  initialRound: LiveRound;
  competitionId: string;
  children: ReactNode;
}) {
  return (
    <MultiRoundResultProvider
      initialRounds={[initialRound]}
      competitionId={competitionId}
    >
      {children}
    </MultiRoundResultProvider>
  );
}

export function MultiRoundResultProvider({
  initialRounds,
  competitionId,
  children,
}: {
  initialRounds: LiveRound[];
  competitionId: string;
  children: ReactNode;
}) {
  const [pendingResults, updatePendingResults] = useState<LiveResult[]>([]);
  const [pendingQuitCompetitors, updatePendingQuitCompetitors] = useState<
    Set<number>
  >(new Set());

  const api = useAPI();
  const queryClient = useQueryClient();

  const roundQueryOptions = useCallback(
    (roundId: string) => {
      return api.queryOptions(
        "get",
        "/v1/competitions/{competitionId}/live/rounds/{roundId}",
        {
          params: { path: { roundId, competitionId } },
        },
      );
    },
    [api, competitionId],
  );

  // One query per round
  const queries = initialRounds.map((round) => ({
    ...roundQueryOptions(round.id),
    initialData: round,
  }));

  const {
    liveResultsByRegistrationId,
    stateHashesByRoundId,
    competitors,
    refetchRound,
  } = useQueries({
    queries,
    combine: (queryResults) => ({
      liveResultsByRegistrationId: _.groupBy(
        queryResults.flatMap((r) => r.data.results),
        "registration_id",
      ),
      stateHashesByRoundId: Object.fromEntries(
        queryResults.map((r) => [r.data.id, r.data.state_hash]),
      ),
      competitors: new Map(
        queryResults.flatMap((r) => r.data.competitors.map((c) => [c.id, c])),
      ),
      refetchRound: async (roundId: string) => {
        return queryResults.find((r) => r.data.id === roundId)!.refetch();
      },
    }),
  });

  const diffPendingResults = useCallback(
    <T extends DiffedLiveResult>(
      incomingResults: T[],
      comparisonFn: (pending: LiveResult, incoming: T) => boolean,
    ) => {
      updatePendingResults((prevPendingResults) =>
        prevPendingResults.filter(
          (pr) =>
            !incomingResults.some(
              (ir) =>
                ir.registration_id === pr.registration_id &&
                comparisonFn(pr, ir),
            ),
        ),
      );
    },
    [],
  );

  const onReceived = (roundId: string, diff: DiffProtocolResponse) => {
    const {
      updated = [],
      created = [],
      deleted = [],
      before_hash,
      after_hash,
    } = diff;

    if (before_hash !== stateHashesByRoundId[roundId]) {
      refetchRound(roundId).then((res) => {
        if (!res.isSuccess) {
          return;
        }

        const newData = res.data;
        const newResults = newData.results;
        const newCompetitors = newData.competitors;

        // We just made a full refetch. Only keep those results as "pending"
        //   which are NOT contained exactly in the refetched round.
        // In other words, if we find a competitor with the updated average and the updated best
        //   in the refetched round, then their result is not pending anymore.
        diffPendingResults(newResults, (pr, ir) =>
          compareAttempts(pr.attempts, ir.attempts),
        );

        updatePendingQuitCompetitors((currentlyQuitCompetitors) =>
          // Only keep pending quit markers if they are _still_ in the refetched round
          //   (ie the "quit" has not been executed yet)
          currentlyQuitCompetitors.intersection(
            new Set(newCompetitors.map((r) => r.id)),
          ),
        );
      });
    } else {
      const decompressedUpdated = updated.map(decompressPartialResult);
      const decompressedCreated = created.map(decompressFullResult);

      const roundQuery = roundQueryOptions(roundId);

      queryClient.setQueryData(
        roundQuery.queryKey,
        (oldData: LiveRound): LiveRound => ({
          ...oldData,
          results: applyDiffToLiveResults({
            previousResults: oldData.results,
            updated: decompressedUpdated,
            created: decompressedCreated,
            deleted,
            roundWcifId: roundId,
          }),
          state_hash: after_hash,
          competitors: [...oldData.competitors, ...created.map((c) => c.user)],
        }),
      );

      diffPendingResults(decompressedUpdated, (pr, ir) => {
        // TODO GB: Is there a smarter way to compare these? The incoming values are diffs, meaning (type-wise)
        //   they might not actually contain attempts. What would an attempt-less update look like though?
        return (
          "attempts" in ir &&
          ir.attempts !== undefined &&
          compareAttempts(pr.attempts, ir.attempts)
        );
      });

      updatePendingQuitCompetitors((currentlyQuitCompetitors) =>
        // If a competitor is listed as "deleted", then consider that our pending quit was executed by the backend
        currentlyQuitCompetitors.difference(new Set(deleted)),
      );
    }
  };

  const addPendingLiveResult = useCallback(
    (liveResult: PendingLiveResult, roundWcifId: string) => {
      updatePendingResults((pending) => [
        ...pending,
        ...applyDiffToLiveResults({
          previousResults:
            liveResultsByRegistrationId[liveResult.registration_id],
          updated: [liveResult],
          roundWcifId: roundWcifId,
        }),
      ]);
    },
    [liveResultsByRegistrationId],
  );

  const addPendingQuitCompetitor = useCallback((registrationId: number) => {
    updatePendingQuitCompetitors((currentlyQuitCompetitors) =>
      currentlyQuitCompetitors.add(registrationId),
    );
  }, []);

  const roundIds = initialRounds.map((r) => r.id);
  const connectionState = useResultsSubscriptions(roundIds, onReceived);

  return (
    <LiveResultContext.Provider
      value={{
        liveResultsByRegistrationId,
        pendingLiveResults: pendingResults,
        addPendingLiveResult,
        pendingQuitCompetitors,
        addPendingQuitCompetitor,
        connectionState,
        competitors,
      }}
    >
      {children}
    </LiveResultContext.Provider>
  );
}

export function useLiveResults() {
  const context = useContext(LiveResultContext);
  if (context === undefined) {
    throw new Error("useLiveResults must be used within a LiveResultProvider");
  }
  return context;
}
