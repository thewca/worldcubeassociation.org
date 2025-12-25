import React, { useRef } from 'react';
import { Sticky } from 'semantic-ui-react';
import RegistrationAdministrationList from './RegistrationAdministrationList';
import RegistrationMessage from '../Register/RegistrationMessage';
import messageReducer from '../reducers/messageReducer';
import StoreProvider from '../../../lib/providers/StoreProvider';
import WCAQueryClientProvider from '../../../lib/providers/WCAQueryClientProvider';
import ConfirmProvider from '../../../lib/providers/ConfirmProvider';

export default function RegistrationEdit({ competitionInfo }) {
  const ref = useRef();
  return (
    <div ref={ref}>
      <WCAQueryClientProvider>
        <StoreProvider reducer={messageReducer} initialState={{ messages: [] }}>
          <ConfirmProvider>
            <Sticky context={ref} offset={10}>
              <RegistrationMessage />
            </Sticky>
            <RegistrationAdministrationList competitionInfo={competitionInfo} />
          </ConfirmProvider>
        </StoreProvider>
      </WCAQueryClientProvider>
    </div>
  );
}
