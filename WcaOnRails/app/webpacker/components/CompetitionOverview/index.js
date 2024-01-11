import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import CompetitionView from './CompetitionView';

const queryClient = new QueryClient();

function CompetitionOverview() {
  return (
    <QueryClientProvider client={queryClient}>
      <CompetitionView />
    </QueryClientProvider>
  );
}

export default CompetitionOverview;
