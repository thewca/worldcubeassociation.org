import React, { useRef } from 'react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import RegistrationAdministrationList from './RegistrationAdministrationList';
import RegistrationMessage from '../Register/RegistrationMessage';
import messageReducer from '../reducers/messageReducer';
import StoreProvider from '../../../lib/providers/StoreProvider';
import WCAQueryClientProvider from '../../../lib/providers/WCAQueryClientProvider';

export default function RegistrationEdit({ competitionInfo }) {
  const ref = useRef();
  return (
    <WCAQueryClientProvider>
      <StoreProvider reducer={messageReducer} initialState={{ message: null }}>
        <div ref={ref}>
          <RegistrationMessage parentRef={ref} />
        </div>
        <RegistrationAdministrationList competitionInfo={competitionInfo} />
      </StoreProvider>
    </WCAQueryClientProvider>
  );
}
