"use client";

import { createContext, ReactNode, useCallback, useContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LiveRoundAdmin, LiveRoundState } from "@/types/live";
import { useT } from "@/lib/i18n/useI18n";
import useAPI from "@/lib/wca/useAPI";
import Loading from "@/components/ui/loading";

interface AllRoundInfoProviderType {
  rounds: LiveRoundAdmin[];
  setRoundState: (
    roundId: string,
    state: LiveRoundState,
    patch?: Partial<LiveRoundAdmin>,
  ) => void;
  setCompletedCount: (roundId: string, count: number) => void;
  setTotalCompetitors: (roundId: string, count: number) => void;
}

const AllRoundInfoProvider = createContext<
  AllRoundInfoProviderType | undefined
>(undefined);

const SingleRoundInfoProvider = createContext<LiveRoundAdmin | undefined>(
  undefined,
);

export function RoundInfoProvider({
  roundId,
  children,
}: {
  roundId: string;
  children: ReactNode;
}) {
  const { rounds } = useAllRoundsInfo();

  const round = rounds.find((r) => r.id === roundId);

  if (!round) {
    return "Round not found";
  }

  return (
    <SingleRoundInfoProvider.Provider value={round}>
      {children}
    </SingleRoundInfoProvider.Provider>
  );
}

export function RoundsInfoProvider({
  competitionId,
  children,
  initialRounds,
}: {
  competitionId: string;
  children: ReactNode;
  initialRounds: LiveRoundAdmin[];
}) {
  const { t } = useT();
  const api = useAPI();
  const queryClient = useQueryClient();

  const roundsQueryOptions = api.queryOptions(
    "get",
    "/v1/competitions/{competitionId}/live/rounds",
    { params: { path: { competitionId } } },
  );
  const { queryKey } = roundsQueryOptions;

  const { data, isLoading } = useQuery({
    ...roundsQueryOptions,
    initialData: { rounds: initialRounds },
  });

  const patchRound = useCallback(
    (roundId: string, patch: (round: LiveRoundAdmin) => LiveRoundAdmin) => {
      queryClient.setQueryData(
        queryKey,
        (old: { rounds: LiveRoundAdmin[] }) => ({
          rounds: old.rounds.map((r) => (r.id === roundId ? patch(r) : r)),
        }),
      );
    },
    [queryClient, queryKey],
  );

  const setRoundState = useCallback(
    (roundId: string, state: LiveRoundState, patch?: Partial<LiveRoundAdmin>) =>
      patchRound(roundId, (r) => ({ ...r, ...patch, state }) as LiveRoundAdmin),
    [patchRound],
  );

  const setCompletedCount = useCallback(
    (roundId: string, count: number) =>
      patchRound(roundId, (r) =>
        r.state === "open" ? { ...r, completed_competitors: count } : r,
      ),
    [patchRound],
  );

  const setTotalCompetitors = useCallback(
    (roundId: string, count: number) =>
      patchRound(roundId, (r) =>
        r.state === "open" || r.state === "locked"
          ? { ...r, total_competitors: count }
          : r,
      ),
    [patchRound],
  );

  if (isLoading) {
    return <Loading />;
  }

  if (!data) {
    return t("competitions.registration_v2.errors.events");
  }

  return (
    <AllRoundInfoProvider.Provider
      value={{
        rounds: data.rounds,
        setRoundState,
        setCompletedCount,
        setTotalCompetitors,
      }}
    >
      {children}
    </AllRoundInfoProvider.Provider>
  );
}

export function useAllRoundsInfo() {
  const context = useContext(AllRoundInfoProvider);
  if (context === undefined) {
    throw new Error("useAllRoundsInfo must be used within a RoundInfoProvider");
  }
  return context;
}

export function useRoundInfo() {
  const context = useContext(SingleRoundInfoProvider);
  if (context === undefined) {
    throw new Error("useRoundInfo must be used within a RoundInfoProvider");
  }
  return context;
}
