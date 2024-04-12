import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserContext } from '../Context/user_context';
import StepPanel from './StepPanel';
import RegistrationProvider from '../Providers/RegistrationProvider';
import { CompetitionContext } from '../Context/competition_context';
import '../../../lib/i18next';

const queryClient = new QueryClient();

export default function Register({ competitionInfo, userInfo, preferredEvents }) {
  return (
    <QueryClientProvider client={queryClient}>
      {/* eslint-disable-next-line react/jsx-no-constructed-context-values */}
      <CompetitionContext.Provider value={{ competitionInfo }}>
        {/* eslint-disable-next-line react/jsx-no-constructed-context-values */}
        <UserContext.Provider value={{
          user: userInfo,
          preferredEvents,
        }}
        >
          <RegistrationProvider>
            <StepPanel />
          </RegistrationProvider>
        </UserContext.Provider>
      </CompetitionContext.Provider>
    </QueryClientProvider>
  );
}
