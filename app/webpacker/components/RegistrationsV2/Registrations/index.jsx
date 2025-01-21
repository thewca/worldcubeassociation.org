import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RegistrationList from './RegistrationList';

export default function Index({ competitionInfo, userInfo }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <RegistrationList
        competitionInfo={competitionInfo}
        userId={userInfo?.id}
      />
    </QueryClientProvider>
  );
}
