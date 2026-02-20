"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { LiveResult, LiveRound } from "@/types/live";
import useAPI from "@/lib/wca/useAPI";
import useResultsSubscription, {
  ConnectionState,
  DiffProtocolResponse,
} from "@/lib/hooks/useResultsSubscription";
import { applyDiffToLiveResults } from "@/lib/live/applyDiffToLiveResults";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface LiveResultContextType {
  liveResults: LiveResult[];
  pendingLiveResults: LiveResult[];
  addPendingLiveResult: (liveResult: LiveResult) => void;
  stateHash: string;
  connectionState: ConnectionState;
  refetch: () => void;
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
  const [pendingResults, updatePendingResults] = useState<LiveResult[]>([]);

  const api = useAPI();
  const queryClient = useQueryClient();
  const queryOptions = api.queryOptions(
    "get",
    "/v1/competitions/{competitionId}/live/rounds/{roundId}",
    {
      params: {
        path: { roundId: initialRound.id, competitionId },
      },
    },
  );

  const { refetch, data } = useQuery({
    ...queryOptions,
    initialData: initialRound,
  });

  const { results, state_hash } = data;

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
          (oldData: LiveRound) => ({
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

  const addPendingLiveResult = useCallback((liveResult: LiveResult) => {
    updatePendingResults((pending) => [...pending, liveResult]);
  }, []);

  const connectionState = useResultsSubscription(initialRound.id, onReceived);

  return (
    <LiveResultContext.Provider
      value={{
        pendingLiveResults: pendingResults,
        addPendingLiveResult,
        liveResults: results,
        stateHash: state_hash,
        refetch,
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
