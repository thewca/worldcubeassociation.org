import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import StepPanel from './StepPanel';
import { getSingleRegistration } from '../api/registration/get/get_registrations';
import Loading from '../../Requests/Loading';
import RegistrationMessage, { setMessage } from './RegistrationMessage';
import StoreProvider, { useDispatch } from '../../../lib/providers/StoreProvider';
import messageReducer from '../reducers/messageReducer';
import WCAQueryClientProvider from '../../../lib/providers/WCAQueryClientProvider';

export default function Index({ competitionInfo, userInfo, preferredEvents }) {
  return (
    <WCAQueryClientProvider>
      <StoreProvider reducer={messageReducer} initialState={{ message: null }}>
        <Register
          competitionInfo={competitionInfo}
          userInfo={userInfo}
          preferredEvents={preferredEvents}
        />
      </StoreProvider>
    </WCAQueryClientProvider>
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
          <div ref={ref}>
            <RegistrationMessage parentRef={ref} />
          </div>
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
