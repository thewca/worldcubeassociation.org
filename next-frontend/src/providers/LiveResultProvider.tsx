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
import { useQuery, useQueryClient } from "@tanstack/react-query";

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
  const queryOptions = api.queryOptions(
    "get",
    "/v1/competitions/{competitionId}/live/rounds/{roundId}",
    {
      params: {
        path: { roundId, competitionId },
      },
    },
  );

  const { refetch, data } = useQuery({
    ...queryOptions,
    initialData: initialRound,
  });

  const { results, state_hash } = data!;

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
        refetch();
      } else {
        queryClient.setQueryData(
          queryOptions.queryKey,
          (oldData: components["schemas"]["LiveRound"]) => ({
            ...oldData,
            results: applyDiffToLiveResults(
              oldData.results,
              updated,
              created,
              deleted,
            ),
            state_hash: after_hash,
          }),
        );
      }
    },
    [queryClient, queryOptions.queryKey, refetch, state_hash],
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
