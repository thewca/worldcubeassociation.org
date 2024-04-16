import React from 'react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import RegistrationAdministrationList from './RegistrationAdministrationList';
import RegistrationMessage from '../Register/RegistrationMessage';
import messageReducer from '../reducers/messageReducer';
import StoreProvider from '../../../lib/providers/StoreProvider';

export default function RegistrationEdit({ competitionInfo }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <StoreProvider reducer={messageReducer} initialState={{ message: null }}>
        <RegistrationMessage />
        <RegistrationAdministrationList competitionInfo={competitionInfo} />
      </StoreProvider>
    </QueryClientProvider>
  );
}
