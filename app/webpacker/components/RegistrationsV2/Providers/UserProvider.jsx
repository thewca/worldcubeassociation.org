import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { getJWT } from '../api/auth/get_jwt';
import { UserContext } from '../Context/user_context';
import getMe from '../api/user/get/get_me';
import getPreferredEvents from '../api/user/get/get_preferred_events';
import LoadingMessage from '../messages/LoadingMessage';

export default function UserProvider({ children }) {
  const {
    isLoading,
    data: user,
    isError,
  } = useQuery({
    queryKey: ['user-me'],
    queryFn: () => getMe(),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    onError: (_) => {
      // We are not logged in, we set the user to undefined below
    },
    onSuccess: (_) => {
      // Get a new token so when a user switches account it overwrites the token
      getJWT(true);
    },
  });
  const {
    isLoading: preferredEventsLoading,
    data: preferredEvents,
    isError: preferredEventsError,
  } = useQuery({
    queryKey: ['user-preferred'],
    queryFn: () => getPreferredEvents(),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  // eslint-disable-next-line no-nested-ternary
  return isLoading || preferredEventsLoading ? (
    <LoadingMessage />
  )
    : isError ? (
      <UserContext.Provider value={{ user: null, preferredEvents: null }}>
        {children}
      </UserContext.Provider>
    ) : (
      <UserContext.Provider
        value={{
          user,
          preferredEvents: preferredEventsError ? [] : preferredEvents,
        }}
      >
        {children}
      </UserContext.Provider>
    );
}
