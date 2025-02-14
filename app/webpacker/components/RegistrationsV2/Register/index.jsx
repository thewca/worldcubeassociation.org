import React from 'react';
import { useQuery } from '@tanstack/react-query';
import StepPanel from './StepPanel';
import { getSingleRegistration } from '../api/registration/get/get_registrations';
import Loading from '../../Requests/Loading';
import RegistrationMessage, { setMessage } from './RegistrationMessage';
import StoreProvider, { useDispatch } from '../../../lib/providers/StoreProvider';
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
      <StoreProvider reducer={messageReducer} initialState={{ message: null }}>
        <ConfirmProvider>
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
        </ConfirmProvider>
      </StoreProvider>
    </WCAQueryClientProvider>
  );
}

function Panel({
  user,
  preferredEvents,
  competitionInfo,
  registration,
  refetchRegistration,
  connectedAccountId,
  stripePublishableKey,
  qualifications,
}) {
  return (
    <>
      <RegistrationMessage />
      <StepPanel
        user={user}
        preferredEvents={preferredEvents}
        competitionInfo={competitionInfo}
        registration={registration}
        refetchRegistration={refetchRegistration}
        connectedAccountId={connectedAccountId}
        stripePublishableKey={stripePublishableKey}
        qualifications={qualifications}
      />
    </>
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
  const dispatch = useDispatch();

  const {
    data: registration,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['registration', competitionInfo.id, userInfo.id],
    queryFn: () => getSingleRegistration(userInfo.id, competitionInfo),
    onError: (data) => {
      const { error } = data.json;
      dispatch(setMessage(
        `competitions.registration_v2.errors.${error}`,
        'negative',
      ));
    },
  });

  const registrationAlreadyOpen = usePerpetualState(
    () => hasPassed(competitionInfo.registration_open),
  );

  const registrationNotYetClosed = usePerpetualState(
    () => hasNotPassed(competitionInfo.registration_close),
  );

  if (isFetching) {
    return <Loading />;
  }

  // User can't register
  if (cannotRegisterReasons.length > 0) {
    return (
      <RegistrationNotAllowedMessage reasons={cannotRegisterReasons} />
    );
  }

  // This is true iff we're exactly between the two timestamps (open and close)
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
        <Panel
          user={userInfo}
          preferredEvents={preferredEvents}
          competitionInfo={competitionInfo}
          registration={registration}
          refetchRegistration={refetch}
          connectedAccountId={connectedAccountId}
          stripePublishableKey={stripePublishableKey}
          qualifications={qualifications}
        />
      )}
    </>
  );
}
