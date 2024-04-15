import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import StepPanel from './StepPanel';
import RegistrationProvider from '../Providers/RegistrationProvider';

const queryClient = new QueryClient();

export default function Register({ competitionInfo, userInfo, preferredEvents }) {
  return (
    <QueryClientProvider client={queryClient}>
      <RegistrationProvider competitionInfo={competitionInfo} user={userInfo}>
        <StepPanel
          user={userInfo}
          preferredEvents={preferredEvents}
          competitionInfo={competitionInfo}
        />
      </RegistrationProvider>
    </QueryClientProvider>
  );
}
