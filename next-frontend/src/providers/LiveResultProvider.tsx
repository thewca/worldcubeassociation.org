"use client";

import { createContext, ReactNode, useContext } from "react";
import { LiveResult, LiveRound } from "@/types/live";
import useAPI from "@/lib/wca/useAPI";
import useResultsSubscriptions, {
  ConnectionState,
  DiffProtocolResponse,
} from "@/lib/hooks/useResultsSubscription";
import { applyDiffToLiveResults } from "@/lib/live/applyDiffToLiveResults";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import _ from "lodash";
import useEffectEvent from "@/lib/hooks/useEffectEvent";

export type LiveResultsByRegistrationId = Record<string, LiveResult[]>;

interface LiveResultContextType {
  liveResultsByRegistrationId: LiveResultsByRegistrationId;
  connectionState: ConnectionState;
}

const LiveResultContext = createContext<LiveResultContextType | undefined>(
  undefined,
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
  const api = useAPI();
  const queryClient = useQueryClient();

  // One query per round
  const queries = initialRounds.map((round) => ({
    ...api.queryOptions(
      "get",
      "/v1/competitions/{competitionId}/live/rounds/{roundId}",
      {
        params: { path: { roundId: round.id, competitionId } },
      },
    ),
    initialData: round,
  }));

  const { liveResultsByRegistrationId, stateHashesByRoundId } = useQueries({
    queries,
    combine: (results) => ({
      liveResultsByRegistrationId: _.groupBy(
        results.flatMap((r, i) =>
          r.data.results.map((res) => ({
            ...res,
            // To differentiate between results for Dual Rounds
            round_wcif_id: initialRounds[i].id,
          })),
        ),
        "registration_id",
      ),
      stateHashesByRoundId: Object.fromEntries(
        results.map((r) => [r.data.id, r.data.state_hash]),
      ),
    }),
  });

  const roundIds = initialRounds.map((r) => r.id);

  const onReceived = useEffectEvent(
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

      const query = queries[queryIndex];

      if (before_hash !== stateHashesByRoundId[roundId]) {
        queryClient.refetchQueries({ queryKey: query.queryKey, exact: true });
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
  );

  const connectionState = useResultsSubscriptions(roundIds, onReceived);

  return (
    <LiveResultContext.Provider
      value={{
        liveResultsByRegistrationId,
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
