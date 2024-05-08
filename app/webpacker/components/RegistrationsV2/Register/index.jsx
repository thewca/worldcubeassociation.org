import React, { useRef } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import StepPanel from './StepPanel';
import { getSingleRegistration } from '../api/registration/get/get_registrations';
import Loading from '../../Requests/Loading';
import RegistrationMessage, { setMessage } from './RegistrationMessage';
import StoreProvider, { useDispatch } from '../../../lib/providers/StoreProvider';
import messageReducer from '../reducers/messageReducer';

const queryClient = new QueryClient();

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
  const ref = useRef();
  const {
    data: registration,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['registration', competitionInfo.id, userInfo.id],
    queryFn: () => getSingleRegistration(userInfo.id, competitionInfo.id),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    refetchOnMount: 'always',
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
          <RegistrationMessage ref={ref} />
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
