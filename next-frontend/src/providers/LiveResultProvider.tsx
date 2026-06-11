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
  pendingLiveResults: PendingLiveResult[];
  addPendingQuitCompetitor: (registrationId: number) => void;
  pendingQuitCompetitors: Set<number>;
  connectionState: ConnectionState;
  // All competitors across the rounds in this provider. For linked/dual rounds
  //   this includes competitors from every linked round.
  combinedCompetitors: Map<number, LiveCompetitor>;
  // Only the competitors who actually take part in the round (ie have a result
  //   row in it). Use this for the comboboxes so they don't list people who are
  //   only part of a sibling linked round.
  roundCompetitors: Map<number, LiveCompetitor>;
}

const LiveResultContext = createContext<LiveResultContextType | undefined>(
  undefined,
);

const compareAttempts = (
  attemptsA: LiveAttempt[],
  attemptsB: LiveAttempt[],
) => {
  const sortedA = attemptsA.toSorted(
    (a, b) => a.attempt_number - b.attempt_number,
  );
  const sortedB = attemptsB.toSorted(
    (a, b) => a.attempt_number - b.attempt_number,
  );

  return (
    sortedA.length === sortedB.length &&
    sortedA.every(
      (a, i) =>
        a.value === sortedB[i].value &&
        a.attempt_number === sortedB[i].attempt_number,
    )
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
  const [pendingResults, updatePendingResults] = useState<PendingLiveResult[]>(
    [],
  );
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
    combinedCompetitors,
    roundCompetitors,
    refetchRound,
  } = useQueries({
    queries,
    combine: (queryResults) => {
      // The first query is the round we're actually on; linked sibling rounds
      //   (if any) follow. For linked rounds every round's `competitors` is the
      //   combined set, so we scope roundCompetitors to this round's own results.
      const [currentRound] = queryResults;
      const currentRegistrationIds = new Set(
        currentRound.data.results.map((result) => result.registration_id),
      );
      return {
        liveResultsByRegistrationId: _.groupBy(
          queryResults.flatMap((r) => r.data.results),
          "registration_id",
        ),
        stateHashesByRoundId: Object.fromEntries(
          queryResults.map((r) => [r.data.id, r.data.state_hash]),
        ),
        combinedCompetitors: new Map(
          queryResults.flatMap((r) => r.data.competitors.map((c) => [c.id, c])),
        ),
        roundCompetitors: new Map(
          currentRound.data.competitors
            .filter((c) => currentRegistrationIds.has(c.id))
            .map((c) => [c.id, c]),
        ),
        refetchRound: async (roundId: string) => {
          return queryResults.find((r) => r.data.id === roundId)!.refetch();
        },
      };
    },
  });

  const diffPendingResults = useCallback(
    <T extends DiffedLiveResult>(
      incomingResults: T[],
      comparisonFn: (pending: PendingLiveResult, incoming: T) => boolean,
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
        // In other words, if we find a competitor with the updated attempts
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
        // The incoming values are diffs, meaning (type-wise)
        //   they might not actually contain attempts. For example when only advancing is updated
        return (
          ir.attempts !== undefined && compareAttempts(pr.attempts, ir.attempts)
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

  const refetchAndClearPending = (roundId: string) => {
    refetchRound(roundId).then((res) => {
      if (!res.isSuccess) {
        return;
      }
      diffPendingResults(res.data.results, (pr, ir) =>
        compareAttempts(pr.attempts, ir.attempts),
      );
    });
  };

  const roundIds = initialRounds.map((r) => r.id);
  const connectionState = useResultsSubscriptions(
    roundIds,
    competitionId,
    onReceived,
    refetchAndClearPending,
  );

  return (
    <LiveResultContext.Provider
      value={{
        liveResultsByRegistrationId,
        pendingLiveResults: pendingResults,
        addPendingLiveResult,
        pendingQuitCompetitors,
        addPendingQuitCompetitor,
        connectionState,
        combinedCompetitors,
        roundCompetitors,
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
