import React, { useRef } from 'react';
import RegistrationEditor from './RegistrationEditor';
import RegistrationMessage from '../Register/RegistrationMessage';
import messageReducer from '../reducers/messageReducer';
import StoreProvider from '../../../lib/providers/StoreProvider';
import WCAQueryClientProvider from '../../../lib/providers/WCAQueryClientProvider';

export default function RegistrationEdit({ competitionInfo, user }) {
  const ref = useRef();
  return (
    <WCAQueryClientProvider>
      <StoreProvider reducer={messageReducer} initialState={{ message: null }}>
        <div ref={ref}>
          <RegistrationMessage parentRef={ref} />
        </div>
        <RegistrationEditor competitionInfo={competitionInfo} competitor={user} />
      </StoreProvider>
    </WCAQueryClientProvider>
  );
}
