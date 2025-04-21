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
import StepConfigProvider, { useStepConfig } from '../lib/StepConfigProvider';
import StepNavigationProvider from '../lib/StepNavigationProvider';
import { availableSteps, registrationOverviewConfig } from '../lib/stepConfigs';

// The following states should show the Panel even when registration is already closed.
//   (You can think of this as "is there a non-cancelled, non-rejected registration?)
const editableRegistrationStates = ['accepted', 'pending', 'waiting_list'];

export default function Index({
  competitionInfo,
  userInfo,
  userCanPreRegister,
  preferredEvents,
  personalRecords,
  cannotRegisterReasons,
  isProcessing = false,
}) {
  return (
    <WCAQueryClientProvider>
      <StoreProvider reducer={messageReducer} initialState={{ messages: [] }}>
        <ConfirmProvider>
          <StepConfigProvider competitionId={competitionInfo.id}>
            <RegistrationProvider
              competitionInfo={competitionInfo}
              userInfo={userInfo}
              isProcessing={isProcessing}
            >
              <RegisterNavigationWrapper
                competitionInfo={competitionInfo}
                userInfo={userInfo}
                userCanPreRegister={userCanPreRegister}
                preferredEvents={preferredEvents}
                personalRecords={personalRecords}
                cannotRegisterReasons={cannotRegisterReasons}
              />
            </RegistrationProvider>
          </StepConfigProvider>
        </ConfirmProvider>
      </StoreProvider>
    </WCAQueryClientProvider>
  );
}

function RegisterNavigationWrapper({
  competitionInfo,
  userInfo,
  userCanPreRegister,
  preferredEvents,
  personalRecords,
  cannotRegisterReasons,
}) {
  const registrationPayload = useRegistration();

  const {
    isFetching: registrationFetching,
    isRejected: registrationRejected,
  } = registrationPayload;

  const { steps, isFetching } = useStepConfig();

  if (isFetching || registrationFetching) {
    return <Loading />;
  }

  return (
    <StepNavigationProvider
      stepsConfiguration={steps}
      availableSteps={availableSteps}
      payload={registrationPayload}
      navigationDisabled={registrationRejected}
      summaryPanelKey={registrationOverviewConfig.key}
    >
      <Register
        competitionInfo={competitionInfo}
        userInfo={userInfo}
        userCanPreRegister={userCanPreRegister}
        preferredEvents={preferredEvents}
        personalRecords={personalRecords}
        cannotRegisterReasons={cannotRegisterReasons}
      />
    </StepNavigationProvider>
  );
}

function Register({
  userCanPreRegister,
  competitionInfo,
  personalRecords,
  userInfo,
  preferredEvents,
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
            personalRecords={personalRecords}
          />
        </>
      )}
    </>
  );
}
