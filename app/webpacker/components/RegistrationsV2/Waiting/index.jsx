import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import WaitingList from './WaitingList';

export default function Index({ competitionInfo }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <WaitingList
        competitionInfo={competitionInfo}
      />
    </QueryClientProvider>
  );
}
