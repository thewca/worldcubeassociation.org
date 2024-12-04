import React, { useCallback, useState } from 'react';
import StepPanel from './StepPanel';
import Loading from '../../Requests/Loading';
import RegistrationMessage from './RegistrationMessage';
import StoreProvider from '../../../lib/providers/StoreProvider';
import messageReducer from '../reducers/messageReducer';
import WCAQueryClientProvider from '../../../lib/providers/WCAQueryClientProvider';
import ConfirmProvider from '../../../lib/providers/ConfirmProvider';
import RegistrationClosedMessage from './RegistrationClosedMessage';
import RegistrationProvider, { useRegistration } from '../lib/RegistrationProvider';

export default function Index({
  competitionInfo,
  userInfo,
  userCanPreRegister,
  preferredEvents,
  qualifications,
  stripePublishableKey = '',
  connectedAccountId = '',
}) {
  return (
    <WCAQueryClientProvider>
      <StoreProvider reducer={messageReducer} initialState={{ message: null }}>
        <ConfirmProvider>
          <RegistrationProvider competitionInfo={competitionInfo} userInfo={userInfo}>
            <Register
              competitionInfo={competitionInfo}
              userInfo={userInfo}
              userCanPreRegister={userCanPreRegister}
              preferredEvents={preferredEvents}
              stripePublishableKey={stripePublishableKey}
              connectedAccountId={connectedAccountId}
              qualifications={qualifications}
            />
          </RegistrationProvider>
        </ConfirmProvider>
      </StoreProvider>
    </WCAQueryClientProvider>
  );
}

function Register({
  userCanPreRegister,
  competitionInfo,
  qualifications,
  userInfo,
  preferredEvents,
  connectedAccountId,
  stripePublishableKey,
}) {
  const [timerEnded, setTimerEnded] = useState(false);

  const onTimerEnd = useCallback(() => {
    setTimerEnded(true);
  }, [setTimerEnded]);

  const { isFetching, registration } = useRegistration();

  if (isFetching) {
    return <Loading />;
  }

  if (registration || userCanPreRegister || competitionInfo['registration_currently_open?'] || timerEnded) {
    return (
      <>
        <RegistrationMessage />
        <StepPanel
          user={userInfo}
          preferredEvents={preferredEvents}
          competitionInfo={competitionInfo}
          connectedAccountId={connectedAccountId}
          stripePublishableKey={stripePublishableKey}
          qualifications={qualifications}
        />
      </>
    );
  }

  return (
    <RegistrationClosedMessage
      registrationStart={competitionInfo.registration_open}
      onTimerEnd={onTimerEnd}
    />
  );
}
