"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import {
  LiveAttempt,
  LiveCompetitor,
  LiveResult,
  LiveRound,
  PendingLiveResult,
  StagedLiveResult,
} from "@/types/live";
import useAPI from "@/lib/wca/useAPI";
import useResultsSubscriptions, {
  CONNECTION_STATE_CONNECTED,
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
import { countCompletedResults } from "@/lib/live/countCompletedResults";
import { useAllRoundsInfo } from "@/providers/RoundInfoProvider";

export type LiveResultsByRegistrationId = Record<string, LiveResult[]>;
interface LiveResultContextType {
  liveResultsByRegistrationId: LiveResultsByRegistrationId;
  addPendingLiveResult: (
    liveResult: PendingLiveResult,
    roundWcifId: string,
  ) => void;
  pendingLiveResults: StagedLiveResult[];
  addPendingQuitCompetitor: (registrationId: number) => void;
  pendingQuitCompetitors: Set<number>;
  connectionState: ConnectionState;
  competitors: Map<number, LiveCompetitor>;
}

const LiveResultContext = createContext<LiveResultContextType | undefined>(
  undefined,
);

// The websocket is the primary channel. These polls are the fallback for when it
// stops delivering without telling us: a sleeping tab, a captive portal, or a
// broadcast dropped between two heartbeats. Results waiting to be confirmed are
// polled for aggressively, an idle round is only checked occasionally.
// They double as the quiet period: a broadcast that arrived within the last
// interval is proof enough that the socket works, so we skip that poll. A dropped
// diff doesn't need one either, the `before_hash` check resyncs us as soon as the
// next broadcast arrives.
const POLL_INTERVAL_WAITING_MS = 5_000;
const POLL_INTERVAL_IDLE_MS = 60_000;

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
  const [pendingResults, updatePendingResults] = useState<StagedLiveResult[]>(
    [],
  );
  const [pendingQuitCompetitors, updatePendingQuitCompetitors] = useState<
    Set<number>
  >(new Set());

  const api = useAPI();
  const queryClient = useQueryClient();
  const { rounds, setCompletedCount, setTotalCompetitors } = useAllRoundsInfo();

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
      comparisonFn: (pending: StagedLiveResult, incoming: T) => boolean,
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

  // Full refetch: used whenever we can't trust our incremental state, either
  // because a diff didn't line up with what we have, or because we polled.
  const resyncRound = (roundId: string) => {
    refetchRound(roundId).then((res) => {
      if (!res.isSuccess) {
        return;
      }

      const newData = res.data;
      const newResults = newData.results;
      const newCompetitors = newData.competitors;

      setCompletedCount(roundId, newData.completed_competitors);
      setTotalCompetitors(roundId, newCompetitors.length);

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
  };

  // Not state: this only ever gates a timer, re-rendering on every broadcast for it
  // would be wasteful.
  const lastMessageAt = useRef(0);

  const onReceived = (roundId: string, diff: DiffProtocolResponse) => {
    lastMessageAt.current = Date.now();

    const {
      updated = [],
      created = [],
      deleted = [],
      before_hash,
      after_hash,
    } = diff;

    if (before_hash !== stateHashesByRoundId[roundId]) {
      resyncRound(roundId);
    } else {
      const decompressedUpdated = updated.map(decompressPartialResult);
      const decompressedCreated = created.map(decompressFullResult);

      const deletedSet = new Set(deleted);
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
          competitors: [
            ...oldData.competitors,
            ...created.map((c) => c.user),
          ].filter((c) => !deletedSet.has(c.id)),
        }),
      );

      const newRound = queryClient.getQueryData<LiveRound>(roundQuery.queryKey);
      if (newRound) {
        setCompletedCount(roundId, countCompletedResults(newRound));
        setTotalCompetitors(roundId, newRound.results.length);
      }

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
        }).map((result) => ({ ...result, staged_at: Date.now() })),
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
  const connectionState = useResultsSubscriptions(
    roundIds,
    competitionId,
    onReceived,
    resyncRound,
  );

  const waitingForConfirmation =
    pendingResults.length > 0 ||
    pendingQuitCompetitors.size > 0 ||
    connectionState !== CONNECTION_STATE_CONNECTED;

  const resyncAllRounds = useEffectEvent((quietPeriodMs: number) => {
    if (Date.now() - lastMessageAt.current < quietPeriodMs) {
      return;
    }

    roundIds
      // A locked round is final, there is nothing left to poll for.
      .filter(
        (roundId) => rounds.find((r) => r.id === roundId)?.state !== "locked",
      )
      .forEach((roundId) => resyncRound(roundId));
  });

  useEffect(() => {
    const pollInterval = waitingForConfirmation
      ? POLL_INTERVAL_WAITING_MS
      : POLL_INTERVAL_IDLE_MS;

    const poll = () => resyncAllRounds(pollInterval);
    // Coming back from a locked screen or a dead network is exactly when our
    // state is most likely to be stale, so resync unconditionally and don't wait
    // for the next tick.
    const resyncNow = () => resyncAllRounds(0);

    const interval = setInterval(poll, pollInterval);
    window.addEventListener("focus", resyncNow);
    window.addEventListener("online", resyncNow);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", resyncNow);
      window.removeEventListener("online", resyncNow);
    };
  }, [waitingForConfirmation]);

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
