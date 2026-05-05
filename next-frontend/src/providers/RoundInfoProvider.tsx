"use client";

import { createContext, ReactNode, useContext } from "react";
import { LiveRoundAdmin } from "@/types/live";
import { useT } from "@/lib/i18n/useI18n";
import useAPI from "@/lib/wca/useAPI";
import Loading from "@/components/ui/loading";

interface AllRoundInfoProviderType {
  rounds: LiveRoundAdmin[];
  refetch: () => void;
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

  const { data, isLoading, refetch } = api.useQuery(
    "get",
    "/v1/competitions/{competitionId}/live/rounds",
    { params: { path: { competitionId } } },
    {
      initialData: { rounds: initialRounds },
    },
  );

  if (isLoading) {
    return <Loading />;
  }

  if (!data) {
    return t("competitions.registration_v2.errors.events");
  }

  return (
    <AllRoundInfoProvider.Provider value={{ rounds: data.rounds, refetch }}>
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
