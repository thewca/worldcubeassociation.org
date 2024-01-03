import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import CompetitionFilters from './CompetitionFilters';

const queryClient = new QueryClient();

function CompetitionOverview() {
  return (
    <QueryClientProvider client={queryClient}>
      <CompetitionFilters />
    </QueryClientProvider>
  );
}

export default CompetitionOverview;
