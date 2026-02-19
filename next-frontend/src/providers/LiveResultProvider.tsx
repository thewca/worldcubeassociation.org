"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { LiveResult } from "@/types/live";
import useAPI from "@/lib/wca/useAPI";
import useResultsSubscription, {
  DiffProtocolResponse,
} from "@/lib/hooks/useResultsSubscription";
import { applyDiffToLiveResults } from "@/lib/live/applyDiffToLiveResults";

interface LiveResultContextType {
  liveResults: LiveResult[];
  updateLiveResults: React.Dispatch<React.SetStateAction<LiveResult[]>>;
  stateHash: string;
  connectionState: string;
  updateStateHash: React.Dispatch<React.SetStateAction<string>>;
  refetch: () => Promise<void>;
}

const LiveResultContext = createContext<LiveResultContextType | undefined>(
  undefined,
);

export function LiveResultProvider({
  initialResults,
  initialHash,
  roundId,
  competitionId,
  children,
}: {
  initialResults: LiveResult[];
  initialHash: string;
  roundId: string;
  competitionId: string;
  children: ReactNode;
}) {
  const [liveResults, updateLiveResults] =
    useState<LiveResult[]>(initialResults);
  const [stateHash, updateStateHash] = useState<string>(initialHash);
  const api = useAPI();

  const { refetch } = api.useQuery(
    "get",
    "/v1/competitions/{competitionId}/live/rounds/{roundId}",
    {
      enabled: false,
      params: {
        path: { roundId, competitionId },
      },
    },
  );

  const refetchResults = useCallback(async () => {
    const { data } = await refetch();
    if (data) {
      updateLiveResults(data.results);
      updateStateHash(data.state_hash);
    }
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

      if (before_hash !== stateHash) {
        refetchResults();
      } else {
        updateLiveResults((results) =>
          applyDiffToLiveResults(results, updated, created, deleted),
        );
        updateStateHash(after_hash);
      }
    },
    [refetchResults, stateHash],
  );

  const connectionState = useResultsSubscription(roundId, onReceived);

  return (
    <LiveResultContext.Provider
      value={{
        liveResults,
        updateLiveResults,
        stateHash,
        updateStateHash,
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
