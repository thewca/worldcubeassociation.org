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
import RegistrationNotYetOpenMessage from './RegistrationNotYetOpenMessage';
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

  const registrationNotYetOpen = usePerpetualState(
    () => hasNotPassed(competitionInfo.registration_open),
  );

  const registrationAlreadyClosed = usePerpetualState(
    () => hasPassed(competitionInfo.registration_close),
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

  // If Registration is not yet open:
  //  Show the countdown, unless the user is allowed to "slip past" (ie. pre-register)
  if (registrationNotYetOpen && !userCanPreRegister) {
    return (
      <RegistrationNotYetOpenMessage registrationStart={competitionInfo.registration_open} />
    );
  }

  // At this point in the code, we know that:
  // - Registration opening has passed OR
  // - The user is able to pre-register.

  // Note that "Registration opening has passed" (see above)
  //   means that registration MAY already be closed.
  //   So we check whether
  //  - Registration is indeed still open (i.e. not yet closed)
  //  - There's an existing registration to edit (accepted or pending)
  const hasEditableRegistration = registration
    && editableRegistrationStates.includes(registration.competing.registration_status);
  const showRegistrationPanel = hasEditableRegistration || !registrationAlreadyClosed;

  return (
    <>
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
