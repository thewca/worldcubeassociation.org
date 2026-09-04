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
const LIVE_QUERY_RETRIES = 2;

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

const isConfirmedBy = (
  results: LiveResult[],
  pendingResult: StagedLiveResult,
) =>
  results.some(
    (result) =>
      result.registration_id === pendingResult.registration_id &&
      result.round_wcif_id === pendingResult.round_wcif_id &&
      compareAttempts(pendingResult.attempts, result.attempts),
  );

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
  const queries = initialRounds.map((round) => {
    const roundQuery = roundQueryOptions(round.id);

    return {
      ...roundQuery,
      // Pending state reconciles itself from the round data, but the round counters live
      // in another provider's cache and have to be pushed there. Wrapping the fetch
      // rather than doing it at the call sites covers the refetches React Query starts on
      // its own, on focus and on reconnect.
      queryFn: async (context: Parameters<typeof roundQuery.queryFn>[0]) => {
        const data = await roundQuery.queryFn(context);

        setCompletedCount(round.id, data.completed_competitors);
        setTotalCompetitors(round.id, data.results.length);

        return data;
      },
      initialData: round,
      // Overriding the app-wide `retry: false`: on a venue connection a request drops for
      // no lasting reason, and giving up on it means waiting out a whole poll interval
      // before we try again. Uses the default backoff (1s, then 2s).
      retry: LIVE_QUERY_RETRIES,
      // "always" rather than `true`, because the app-wide `staleTime: Infinity` means
      // these queries are never stale and the plain flags only refetch stale ones. Coming
      // back from a locked screen or a dead network is when our state is most likely to
      // be out of date, whatever React Query thinks of its age.
      refetchOnWindowFocus: "always" as const,
      refetchOnReconnect: "always" as const,
    };
  });

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
      // Everything a full refetch needs to fix up happens in the query itself
      refetchRound(roundId);
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

        // Confirmed entries are already hidden by the filter further down, but they have
        // to leave the store too: a later change to the same competitor would stop
        // matching and pop the old entry back up as pending.
        updatePendingResults((pending) =>
          pending.filter(
            (pendingResult) => !isConfirmedBy(newRound.results, pendingResult),
          ),
        );

        updatePendingQuitCompetitors((quitting) =>
          quitting.intersection(new Set(newRound.competitors.map((c) => c.id))),
        );
      }
    }
  };

  const addPendingLiveResult = useCallback(
    (liveResult: PendingLiveResult, roundWcifId: string) => {
      updatePendingResults((pending) => [
        // Same pruning as in onReceived, for when nothing has been broadcast since
        ...pending.filter(
          (pendingResult) =>
            !isConfirmedBy(
              liveResultsByRegistrationId[pendingResult.registration_id] ?? [],
              pendingResult,
            ),
        ),
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
    refetchRound,
  );

  // Derived rather than pruned by whoever brought the data in: a result stops being
  // pending as soon as the round data echoes it back, be that a diff, a poll, or a
  // refetch React Query started on focus or reconnect.
  const pendingLiveResults = pendingResults.filter(
    (pendingResult) =>
      !isConfirmedBy(
        liveResultsByRegistrationId[pendingResult.registration_id] ?? [],
        pendingResult,
      ),
  );

  // A quit that went through takes the competitor out of the round.
  const pendingQuits = pendingQuitCompetitors.intersection(
    new Set(competitors.keys()),
  );

  const waitingForConfirmation =
    pendingLiveResults.length > 0 ||
    pendingQuits.size > 0 ||
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
      .forEach((roundId) => refetchRound(roundId));
  });

  useEffect(() => {
    const pollInterval = waitingForConfirmation
      ? POLL_INTERVAL_WAITING_MS
      : POLL_INTERVAL_IDLE_MS;

    // Waking from a locked screen or a dead network is handled by the queries'
    // `refetchOnWindowFocus` / `refetchOnReconnect` above.
    const interval = setInterval(
      () => resyncAllRounds(pollInterval),
      pollInterval,
    );

    return () => clearInterval(interval);
  }, [waitingForConfirmation]);

  return (
    <LiveResultContext.Provider
      value={{
        liveResultsByRegistrationId,
        pendingLiveResults,
        addPendingLiveResult,
        pendingQuitCompetitors: pendingQuits,
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
