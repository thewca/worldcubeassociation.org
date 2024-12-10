import React, { useCallback, useState } from 'react';
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
import { hasNotPassed } from '../../../lib/utils/dates';
import RegistrationClosedMessage from './RegistrationClosedMessage';
import RegistrationNotAllowedMessage from './RegistrationNotAllowedMessage';

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
  const [timerEnded, setTimerEnded] = useState(false);

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

  const onTimerEnd = useCallback(() => {
    setTimerEnded(true);
  }, [setTimerEnded]);

  if (isFetching) {
    return <Loading />;
  }

  const Panel = (
    <>
      <RegistrationMessage />
      <StepPanel
        user={userInfo}
        preferredEvents={preferredEvents}
        competitionInfo={competitionInfo}
        registration={registration}
        refetchRegistration={refetch}
        connectedAccountId={connectedAccountId}
        stripePublishableKey={stripePublishableKey}
        qualifications={qualifications}
      />
    </>
  );

  const registrationNotYetOpen = hasNotPassed(competitionInfo.registration_open);

  // User can't register
  if (cannotRegisterReasons.length > 0) {
    return (
      <RegistrationNotAllowedMessage reasons={cannotRegisterReasons} />
    );
  }

  // If Registration is not yet open:
  // render Panel if timer ended || userCanPreRegister
  if (registrationNotYetOpen) {
    if (userCanPreRegister || timerEnded) {
      return (
        <Panel />
      );
    }
    return (
      <RegistrationNotYetOpenMessage
        registrationStart={competitionInfo.registration_open}
        onTimerEnd={onTimerEnd}
      />
    );
  }

  // If Registration is open
  // always render Panel
  if (competitionInfo['registration_currently_open?']) {
    return (
      <Panel />
    );
  }

  // If registration is closed:
  // only render panel if competing status is not cancelled

  if (registration && registration.competing_status !== 'cancelled') {
    return (
      <Panel />
    );
  }

  return (
    <RegistrationClosedMessage registrationEnd={competitionInfo.registration_close} />
  );
}
