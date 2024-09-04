import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import StepPanel from './StepPanel';
import { getSingleRegistration } from '../api/registration/get/get_registrations';
import Loading from '../../Requests/Loading';
import RegistrationMessage, { setMessage } from './RegistrationMessage';
import StoreProvider, { useDispatch } from '../../../lib/providers/StoreProvider';
import messageReducer from '../reducers/messageReducer';
import WCAQueryClientProvider from '../../../lib/providers/WCAQueryClientProvider';
import ConfirmProvider from '../../../lib/providers/ConfirmProvider';

export default function Index({
  competitionInfo, userInfo, preferredEvents,
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
            preferredEvents={preferredEvents}
            stripePublishableKey={stripePublishableKey}
            connectedAccountId={connectedAccountId}
          />
        </ConfirmProvider>
      </StoreProvider>
    </WCAQueryClientProvider>
  );
}

function Register({
  competitionInfo, qualifications, userInfo, preferredEvents, connectedAccountId, stripePublishableKey,
}) {
  const dispatch = useDispatch();
  const ref = useRef();
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
        error
          ? `competitions.registration_v2.errors.${error}`
          : 'registrations.flash.failed',
        'negative',
      ));
    },
  });

  return (
    isFetching ? <Loading />
      : (
        <>
          <div ref={ref}>
            <RegistrationMessage parentRef={ref} />
          </div>
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
      )
  );
}
