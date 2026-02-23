"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { LiveRound } from "@/types/live";
import useResultsSubscription, {
  ConnectionState,
  DiffProtocolResponse,
} from "@/lib/hooks/useResultsSubscription";
import { DualLiveResult } from "@/lib/live/mergeAndOrderResults";
import { decompressDiff } from "@/lib/live/decompressDiff";
import { applyDiffToDualRoundResults } from "@/lib/live/applyDiffToDualRoundResults";
import { components } from "@/types/openapi";
import _ from "lodash";

interface DualRoundLiveResultContextType {
  liveResultsByRegistrationId: Record<string, DualLiveResult[]>;
  stateHash: string;
  connectionState: ConnectionState;
  refetch: () => void;
}

const DualRoundLiveResultContext = createContext<
  DualRoundLiveResultContextType | undefined
>(undefined);

// Temporary fix, there is an issue where results are not correctly overwritten
// in the allOf. I think this is an openapi-typescript issue caused by having a union type with the same
// results key.
type FixedLiveRound = Omit<components["schemas"]["LiveRound"], "results"> & {
  results: components["schemas"]["LiveResult"][];
};

export function DualRoundLiveResultProvider({
  initialRounds,
  children,
}: {
  initialRounds: LiveRound[];
  children: ReactNode;
}) {
  const [liveResultsByRegistrationId, setLiveResultsByRegistrationId] =
    useState(
      _.groupBy(
        initialRounds.flatMap((round) =>
          (round as FixedLiveRound).results.map((r) => ({
            ...r,
            wcifId: round.id,
          })),
        ),
        "registration_id",
      ),
    );

  // Move to onEffectEvent when we are on React 19
  const onReceived = useCallback((result: DiffProtocolResponse) => {
    const { updated = [], created = [], deleted = [], wcif_id } = result;

    setLiveResultsByRegistrationId((results) =>
      applyDiffToDualRoundResults(
        results,
        updated,
        created.map((r) => ({ ...decompressDiff(r), wcifId: wcif_id })),
        deleted,
        wcif_id,
      ),
    );
  }, []);

  const connectionState = useResultsSubscription(
    initialRounds[0].id,
    onReceived,
  );

  return (
    <DualRoundLiveResultContext.Provider
      value={{
        liveResultsByRegistrationId: liveResultsByRegistrationId,
        stateHash: initialRounds[0].state_hash,
        refetch: () => undefined,
        connectionState,
      }}
    >
      {children}
    </DualRoundLiveResultContext.Provider>
  );
}

export function useDualRoundLiveResults() {
  const context = useContext(DualRoundLiveResultContext);
  if (context === undefined) {
    throw new Error("useLiveResults must be used within a LiveResultProvider");
  }
  return context;
}
