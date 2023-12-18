import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import CompetitionFilter from './CompetitionFilters';

const queryClient = new QueryClient();

function CompetitionOverview() {
  return (
    <QueryClientProvider client={queryClient}>
      <CompetitionFilter />
    </QueryClientProvider>
  )
}

export default CompetitionOverview;
