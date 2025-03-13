import React from 'react';
import StepPanel from './StepPanel';
import Loading from '../../Requests/Loading';
import RegistrationProvider, { useRegistration } from '../lib/RegistrationProvider';
import RegistrationMessage from './RegistrationMessage';
import StoreProvider from '../../../lib/providers/StoreProvider';
import messageReducer from '../reducers/messageReducer';
import WCAQueryClientProvider from '../../../lib/providers/WCAQueryClientProvider';
import ConfirmProvider from '../../../lib/providers/ConfirmProvider';
import RegistrationOpeningMessage from './RegistrationOpeningMessage';
import { hasNotPassed, hasPassed } from '../../../lib/utils/dates';
import RegistrationNotAllowedMessage from './RegistrationNotAllowedMessage';
import RegistrationClosingMessage from './RegistrationClosingMessage';
import usePerpetualState from '../hooks/usePerpetualState';

// The following states should show the Panel even when registration is already closed.
//   (You can think of this as "is there a non-cancelled, non-rejected registration?)
const editableRegistrationStates = ['accepted', 'pending', 'waiting_list'];

export default function Index({
  competitionInfo,
  userInfo,
  userCanPreRegister,
  preferredEvents,
  qualifications,
  stripePublishableKey = '',
  connectedAccountId = '',
  cannotRegisterReasons,
}) {
  return (
    <WCAQueryClientProvider>
      <StoreProvider reducer={messageReducer} initialState={{ messages: [] }}>
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
              cannotRegisterReasons={cannotRegisterReasons}
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
  cannotRegisterReasons,
}) {
  const registrationAlreadyOpen = usePerpetualState(
    () => hasPassed(competitionInfo.registration_open),
  );

  const registrationNotYetClosed = usePerpetualState(
    () => hasNotPassed(competitionInfo.registration_close),
  );

  const { isFetching, registration } = useRegistration();

  if (isFetching) {
    return <Loading />;
  }

  // User can't register
  if (cannotRegisterReasons.length > 0) {
    return (
      <RegistrationNotAllowedMessage
        reasons={cannotRegisterReasons}
        competitionInfo={competitionInfo}
        userInfo={userInfo}
      />
    );
  }

  // This is true if we're exactly between the two timestamps (open and close)
  const registrationCurrentlyOpen = registrationAlreadyOpen && registrationNotYetClosed;

  // We should always show the panel to allow editing an existing registration.
  const hasEditableRegistration = registration
    && editableRegistrationStates.includes(registration.competing.registration_status);

  const showRegistrationPanel = registrationCurrentlyOpen
    || (userCanPreRegister && registrationNotYetClosed)
    || hasEditableRegistration;

  return (
    <>
      <RegistrationOpeningMessage registrationStart={competitionInfo.registration_open} />
      <RegistrationClosingMessage registrationEnd={competitionInfo.registration_close} />
      {showRegistrationPanel && (
        <>
          <RegistrationMessage />
          <StepPanel
            user={userInfo}
            preferredEvents={preferredEvents}
            competitionInfo={competitionInfo}
            registration={registration}
            connectedAccountId={connectedAccountId}
            stripePublishableKey={stripePublishableKey}
            qualifications={qualifications}
          />
        </>
      )}
    </>
  );
}
