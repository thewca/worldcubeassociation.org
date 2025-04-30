import React, { useRef } from 'react';
import { Sticky } from 'semantic-ui-react';
import RegistrationEditor from './RegistrationEditor';
import RegistrationMessage from '../Register/RegistrationMessage';
import messageReducer from '../reducers/messageReducer';
import StoreProvider from '../../../lib/providers/StoreProvider';
import WCAQueryClientProvider from '../../../lib/providers/WCAQueryClientProvider';
import ConfirmProvider from '../../../lib/providers/ConfirmProvider';
import RegistrationProvider from '../lib/RegistrationProvider';

export default function RegistrationEdit({ registrationId, competitionInfo, user }) {
  const ref = useRef();
  return (
    <div ref={ref}>
      <WCAQueryClientProvider>
        <StoreProvider reducer={messageReducer} initialState={{ messages: [] }}>
          <ConfirmProvider>
            <RegistrationProvider competitionInfo={competitionInfo} userInfo={user}>
              <Sticky context={ref}>
                <RegistrationMessage />
              </Sticky>
              <RegistrationEditor
                registrationId={registrationId}
                competitionInfo={competitionInfo}
                competitor={user}
              />
            </RegistrationProvider>
          </ConfirmProvider>
        </StoreProvider>
      </WCAQueryClientProvider>
    </div>
  );
}
