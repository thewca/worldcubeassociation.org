import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import CompetitionsView from './CompetitionsView';

const queryClient = new QueryClient();

function CompetitionsOverview({ canViewAdminData = false }) {
  return (
    <QueryClientProvider client={queryClient}>
      <CompetitionsView canViewAdminData={canViewAdminData} />
    </QueryClientProvider>
  );
}

export default CompetitionsOverview;
