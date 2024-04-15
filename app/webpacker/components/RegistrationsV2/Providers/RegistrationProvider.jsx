import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { RegistrationContext } from '../Context/registration_context';
import { getSingleRegistration } from '../api/registration/get/get_registrations';
import setMessage from '../ui/events/messages';
import Loading from '../../Requests/Loading';

export default function RegistrationProvider({ competitionInfo, user, children }) {
  const loggedIn = user !== null;
  const {
    data: registration,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['registration', competitionInfo.id, user?.id],
    queryFn: () => getSingleRegistration(user?.id, competitionInfo.id),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    refetchOnMount: 'always',
    retry: false,
    onError: (err) => {
      setMessage(err.error, 'error');
    },
    enabled: loggedIn,
  });
  // eslint-disable-next-line no-nested-ternary
  return loggedIn && isLoading ? (
    <Loading />
  )
    : isError || !loggedIn || !registration ? (
      <RegistrationContext.Provider
        value={{ registration: null, refetch, isRegistered: false }}
      >
        {children}
      </RegistrationContext.Provider>
    ) : (
      <RegistrationContext.Provider
        value={{
          registration,
          refetch,
          isRegistered:
            registration?.competing?.registration_status !== undefined,
        }}
      >
        {children}
      </RegistrationContext.Provider>
    );
}
