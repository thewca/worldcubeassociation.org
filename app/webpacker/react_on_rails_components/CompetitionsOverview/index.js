import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import CompetitionsView from './CompetitionsView';

const queryClient = new QueryClient();

function CompetitionsOverview({ canViewAdminDetails = false }) {
  return (
    <QueryClientProvider client={queryClient}>
      <CompetitionsView canViewAdminDetails={canViewAdminDetails} />
    </QueryClientProvider>
  );
}

export default CompetitionsOverview;
