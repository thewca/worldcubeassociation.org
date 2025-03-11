"use client";

import React, { createContext, useContext } from "react";
import { components} from "@/lib/wca/wcaSchema";
import {useQuery, UseQueryResult} from "@tanstack/react-query";
import useAPI from "@/lib/wca/useAPI";

const CompetitionContext = createContext<[components["schemas"]["CompetitionInfo"] | null, UseQueryResult | null]>([null, null]);

export const useCompetitionInfo = () => useContext(CompetitionContext)[0];
export const useCompetitionInfoQuery = () => useContext(CompetitionContext)[1];

export default function CompetitionProvider({ competitionId, children }: { competitionId: string, children: React.ReactNode }){
  const api = useAPI();
  const query = useQuery({
    queryKey: ["competition", competitionId],
    queryFn: () => api.GET("/competitions/{competitionId}/", { params: { path: { competitionId } } }),
  })
  const { data: request, isLoading } = query;

  if(isLoading) {
    return (
      <p>Loading...</p>
    )
  }

  if(!request?.data) {
    return (
      <p>Error fetching competition</p>
    )
  }

  return (
    <CompetitionContext.Provider value={[request.data, query]}>
      {children}
    </CompetitionContext.Provider>
  )
}
