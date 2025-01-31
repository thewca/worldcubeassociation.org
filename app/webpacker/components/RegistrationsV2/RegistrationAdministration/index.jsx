import React, { useRef } from 'react';
import { Sticky } from 'semantic-ui-react';
import RegistrationAdministrationContainer from './RegistrationAdministrationContainer';
import RegistrationMessage from '../Register/RegistrationMessage';
import messageReducer from '../reducers/messageReducer';
import StoreProvider from '../../../lib/providers/StoreProvider';
import WCAQueryClientProvider from '../../../lib/providers/WCAQueryClientProvider';

export default function RegistrationEdit({ competitionId }) {
  const ref = useRef();
  return (
    <div ref={ref}>
      <WCAQueryClientProvider>
        <StoreProvider reducer={messageReducer} initialState={{ message: null }}>
          <Sticky context={ref} offset={60}>
            <RegistrationMessage />
          </Sticky>
          <RegistrationAdministrationContainer competitionId={competitionId} />
        </StoreProvider>
      </WCAQueryClientProvider>
    </div>
  );
}
