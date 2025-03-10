"use client";

import React, { createContext, useContext } from "react";
import { components} from "@/lib/wca/wcaSchema";
import { useQuery } from "@tanstack/react-query";
import useAPI from "@/lib/wca/useAPI";

const CompetitionContext = createContext<components["schemas"]["CompetitionInfo"] | null>(null);

export const useCompetitionInfo = () => useContext(CompetitionContext);

export default function CompetitionProvider({ competitionId, children }: { competitionId: string, children: React.ReactNode }){
  const api = useAPI();
  const { data: request, isLoading } = useQuery({
    queryKey: ["permissions", competitionId],
    queryFn: () => api.GET("/competitions/{competitionId}/", { params: { path: { competitionId } } }),
  })

  if(isLoading) {
    return (
      <p>Loading...</p>
    )
  }

  return (
    <CompetitionContext.Provider value={request!.data!}>
      {children}
    </CompetitionContext.Provider>
  )
}
