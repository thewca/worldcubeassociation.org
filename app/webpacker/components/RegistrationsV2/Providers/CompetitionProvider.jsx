import { useQuery } from '@tanstack/react-query';
import React from 'react';
import getCompetitionInfo from '../api/competition/get/get_competition_info';
import { CompetitionContext } from '../Context/competition_context';

export default function CompetitionProvider({ competitionId, children }) {
  const { data: competitionInfo } = useQuery({
    queryKey: [competitionId],
    queryFn: () => getCompetitionInfo(competitionId),
  });

  return (
    <CompetitionContext.Provider
      value={{ competitionInfo: competitionInfo ?? {} }}
    >
      {children}
    </CompetitionContext.Provider>
  );
}
