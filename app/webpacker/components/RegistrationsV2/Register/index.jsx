import React from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import StepPanel from './StepPanel';
import { getSingleRegistration } from '../api/registration/get/get_registrations';
import Loading from '../../Requests/Loading';
import RegistrationMessage, { setMessage } from './RegistrationMessage';
import StoreProvider, { useDispatch } from '../../../lib/providers/StoreProvider';
import messageReducer from '../reducers/messageReducer';

const queryClient = new QueryClient();

export default function Index({
  competitionInfo, userInfo, preferredEvents,
  stripePublishableKey = '',
  connectedAccountId = '',
  clientSecret = '',
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider reducer={messageReducer} initialState={{ message: null }}>
        <Register
          competitionInfo={competitionInfo}
          userInfo={userInfo}
          preferredEvents={preferredEvents}
          stripePublishableKey={stripePublishableKey}
          connectedAccountId={connectedAccountId}
          clientSecret={clientSecret}
        />
      </StoreProvider>
    </QueryClientProvider>
  );
}

function Register({
  competitionInfo, userInfo, preferredEvents, clientSecret, connectedAccountId, stripePublishableKey,
}) {
  const dispatch = useDispatch();
  const {
    data: registration,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['registration', competitionInfo.id, userInfo.id],
    queryFn: () => getSingleRegistration(userInfo.id, competitionInfo.id),
    staleTime: Infinity,
    retry: false,
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
    isLoading ? <Loading />
      : (
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
            clientSecret={clientSecret}
          />
        </>
      )
  );
}
