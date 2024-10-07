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
import RegistrationClosedMessage from './RegistrationClosedMessage';

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
          <Register
            competitionInfo={competitionInfo}
            userInfo={userInfo}
            userCanPreRegister={userCanPreRegister}
            preferredEvents={preferredEvents}
            stripePublishableKey={stripePublishableKey}
            connectedAccountId={connectedAccountId}
            qualifications={qualifications}
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
}) {
  const [timerEnded, setTimerEnded] = useState(false);

  const dispatch = useDispatch();
  const {
    data: registration,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['registration', competitionInfo.id, userInfo.id],
    queryFn: () => getSingleRegistration(userInfo.id, competitionInfo.id),
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

  if (userCanPreRegister || competitionInfo['registration_currently_open?'] || timerEnded) {
    return (
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
  }

  return (
    <RegistrationClosedMessage
      registrationStart={competitionInfo.registration_open}
      onTimerEnd={onTimerEnd}
    />
  );
}
