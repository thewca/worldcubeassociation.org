import React from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import StepPanel from './StepPanel';
import { getSingleRegistration } from '../api/registration/get/get_registrations';
import Loading from '../../Requests/Loading';

const queryClient = new QueryClient();

export default function Index({ competitionInfo, userInfo, preferredEvents }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Register
        competitionInfo={competitionInfo}
        userInfo={userInfo}
        preferredEvents={preferredEvents}
      />
    </QueryClientProvider>
  );
}

function Register({ competitionInfo, userInfo, preferredEvents }) {
  const {
    data: registration,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['registration', competitionInfo.id, userInfo.id],
    queryFn: () => getSingleRegistration(userInfo.id, competitionInfo.id),
    staleTime: Infinity,
    retry: false,
    onError: (err) => {
      setMessage(err.error, 'error');
    },
  });

  return (
    isLoading ? <Loading />
      : (
        <StepPanel
          user={userInfo}
          preferredEvents={preferredEvents}
          competitionInfo={competitionInfo}
          registration={registration}
          refetchRegistration={refetch}
        />
      )
  );
}
