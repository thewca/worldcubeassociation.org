import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import CompetitionsView from './CompetitionsView';

const queryClient = new QueryClient();

function CompetitionsOverview() {
  return (
    <QueryClientProvider client={queryClient}>
      <CompetitionsView />
    </QueryClientProvider>
  );
}

export default CompetitionsOverview;
