"use client";

import { createContext, ReactNode, useCallback, useContext } from "react";
import { LiveResult } from "@/types/live";
import useAPI from "@/lib/wca/useAPI";
import useResultsSubscription, {
  ConnectionState,
  DiffProtocolResponse,
} from "@/lib/hooks/useResultsSubscription";
import { applyDiffToLiveResults } from "@/lib/live/applyDiffToLiveResults";
import { components } from "@/types/openapi";
import { useQueryClient } from "@tanstack/react-query";

interface LiveResultContextType {
  liveResults: LiveResult[];
  stateHash: string;
  connectionState: ConnectionState;
  refetch: () => void;
}

const LiveResultContext = createContext<LiveResultContextType | undefined>(
  undefined,
);

export function LiveResultProvider({
  initialRound,
  roundId,
  competitionId,
  children,
}: {
  initialRound: components["schemas"]["LiveRound"];
  roundId: string;
  competitionId: string;
  children: ReactNode;
}) {
  const api = useAPI();
  const queryClient = useQueryClient();
  const { refetch, data } = api.useQuery(
    "get",
    "/v1/competitions/{competitionId}/live/rounds/{roundId}",
    {
      params: {
        path: { roundId, competitionId },
      },
    },
    {
      initialData: initialRound,
    },
  );

  const { results, state_hash } = data!;

  const refetchResults = useCallback(() => {
    refetch();
  }, [refetch]);

  const onReceived = useCallback(
    (result: DiffProtocolResponse) => {
      const {
        updated = [],
        created = [],
        deleted = [],
        before_hash,
        after_hash,
      } = result;

      if (before_hash !== state_hash) {
        refetchResults();
      } else {
        queryClient.setQueryData(
          api.queryOptions(
            "get",
            "/v1/competitions/{competitionId}/live/rounds/{roundId}",
            {
              params: {
                path: { roundId, competitionId },
              },
            },
          ).queryKey,
          {
            ...initialRound,
            results: applyDiffToLiveResults(results, updated, created, deleted),
            state_hash: after_hash,
          },
        );
      }
    },
    [
      api,
      competitionId,
      initialRound,
      queryClient,
      refetchResults,
      results,
      roundId,
      state_hash,
    ],
  );

  const connectionState = useResultsSubscription(roundId, onReceived);

  return (
    <LiveResultContext.Provider
      value={{
        liveResults: results,
        stateHash: state_hash,
        refetch: refetchResults,
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
