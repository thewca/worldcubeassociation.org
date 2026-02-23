"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { LiveResult, LiveRound } from "@/types/live";
import useAPI from "@/lib/wca/useAPI";
import useResultsSubscriptions, {
  ConnectionState,
  DiffProtocolResponse,
} from "@/lib/hooks/useResultsSubscription";
import { applyDiffToLiveResults } from "@/lib/live/applyDiffToLiveResults";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import _ from "lodash";

type LiveResultsByRegistrationId = Record<string, LiveResult[]>;

interface LiveResultContextType {
  liveResultsByRegistrationId: LiveResultsByRegistrationId;
  connectionState: ConnectionState;
  refetch: () => void;
}

const LiveResultContext = createContext<LiveResultContextType | undefined>(
  undefined,
);

export function LiveResultProvider({
  initialRounds,
  competitionId,
  children,
}: {
  initialRounds: LiveRound[];
  competitionId: string;
  children: ReactNode;
}) {
  const api = useAPI();
  const queryClient = useQueryClient();

  // One query per round
  const queries = initialRounds.map((round) =>
    api.queryOptions(
      "get",
      "/v1/competitions/{competitionId}/live/rounds/{roundId}",
      {
        params: { path: { roundId: round.id, competitionId } },
      },
    ),
  );

  const results = useQueries({
    queries: queries.map((q, i) => ({ ...q, initialData: initialRounds[i] })),
  });

  // Stable ref to latest results as otherwise dynamic arrays (as returned from useQueries) in dependency can cause issues
  const resultsRef = useRef(results);
  useLayoutEffect(() => {
    resultsRef.current = results;
  });

  const roundIds = useMemo(
    () => initialRounds.map((r) => r.id),
    [initialRounds],
  );

  const onReceived = useCallback(
    (roundId: string, diff: DiffProtocolResponse) => {
      const {
        updated = [],
        created = [],
        deleted = [],
        before_hash,
        after_hash,
      } = diff;

      const queryIndex = initialRounds.findIndex((r) => r.id === roundId);
      if (queryIndex === -1) return;

      const result = resultsRef.current[queryIndex];
      const query = queries[queryIndex];

      if (before_hash !== result.data.state_hash) {
        result.refetch();
      } else {
        queryClient.setQueryData(query.queryKey, (oldData: LiveRound) => ({
          ...oldData,
          results: applyDiffToLiveResults(
            oldData.results,
            updated,
            created,
            deleted,
          ),
          state_hash: after_hash,
        }));
      }
    },
    [initialRounds, queries, queryClient],
  );

  const connectionState = useResultsSubscriptions(roundIds, onReceived);

  // Merge results by registration_id for the context
  const liveResultsByRegistrationId = useMemo(
    () =>
      _.groupBy(
        resultsRef.current.flatMap((r, i) =>
          (r.data.results ?? []).map((res) => ({
            ...res,
            // To differentiate between results for Dual Rounds
            wcifId: initialRounds[i].id,
          })),
        ),
        "registration_id",
      ),
    [initialRounds],
  );

  return (
    <LiveResultContext.Provider
      value={{
        liveResultsByRegistrationId,
        refetch: () => results.forEach((r) => r.refetch()),
        connectionState,
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
