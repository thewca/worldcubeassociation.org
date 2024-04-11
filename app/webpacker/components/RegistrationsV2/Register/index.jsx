import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import UserProvider from '../Providers/UserProvider';
import StepPanel from './StepPanel';
import RegistrationProvider from '../Providers/RegistrationProvider';
import CompetitionProvider from '../Providers/CompetitionProvider';

const queryClient = new QueryClient();

export default function Register({ competitionId }) {
  return (
    <QueryClientProvider client={queryClient}>
      <CompetitionProvider competitionId={competitionId}>
        <UserProvider>
          <RegistrationProvider>
            <StepPanel />
          </RegistrationProvider>
        </UserProvider>
      </CompetitionProvider>
    </QueryClientProvider>
  );
}
