import React, { useRef } from 'react';
import RegistrationEditor from './RegistrationEditor';
import RegistrationMessage from '../Register/RegistrationMessage';
import messageReducer from '../reducers/messageReducer';
import StoreProvider from '../../../lib/providers/StoreProvider';
import WCAQueryClientProvider from '../../../lib/providers/WCAQueryClientProvider';
import ConfirmProvider from '../../../lib/providers/ConfirmProvider';

export default function RegistrationEdit({ competitionInfo, user }) {
  const ref = useRef();
  return (
    <WCAQueryClientProvider>
      <StoreProvider reducer={messageReducer} initialState={{ message: null }}>
        <ConfirmProvider>
          <div ref={ref}>
            <RegistrationMessage parentRef={ref} />
          </div>
          <RegistrationEditor competitionInfo={competitionInfo} competitor={user} />
        </ConfirmProvider>
      </StoreProvider>
    </WCAQueryClientProvider>
  );
}
