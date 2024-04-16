import React from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import StepPanel from './StepPanel';
import { getSingleRegistration } from '../api/registration/get/get_registrations';
import Loading from '../../Requests/Loading';
import RegistrationMessage, { setMessage } from './RegistrationMessage';
import StoreProvider, { useDispatch } from '../../../lib/providers/StoreProvider';

const queryClient = new QueryClient();

const messageReducer = (state, { payload }) => ({
  ...state,
  message: { key: payload.key, type: payload.type },
});

export default function Index({ competitionInfo, userInfo, preferredEvents }) {
  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider reducer={messageReducer} initialState={{ message: null }}>
        <Register
          competitionInfo={competitionInfo}
          userInfo={userInfo}
          preferredEvents={preferredEvents}
        />
      </StoreProvider>
    </QueryClientProvider>
  );
}

function Register({ competitionInfo, userInfo, preferredEvents }) {
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
          />
        </>
      )
  );
}
