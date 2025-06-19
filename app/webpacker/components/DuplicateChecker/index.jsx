import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import WCAQueryClientProvider from '../../lib/providers/WCAQueryClientProvider';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';
import computePotentialDuplicates from './api/computePotentialDuplicates';
import getPotentialDuplicatesData from './api/getPotentialDuplicatesData';
import SimilarPersons from './SimilarPersons';
import DuplicateCheckerHeader from './DuplicateCheckerHeader';

export default function Wrapper({ competitionId }) {
  return (
    <WCAQueryClientProvider>
      <DuplicateChecker competitionId={competitionId} />
    </WCAQueryClientProvider>
  );
}

function DuplicateChecker({ competitionId }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['potential-duplicates-data'],
    queryFn: () => getPotentialDuplicatesData({ competitionId }),
  });

  const queryClient = useQueryClient();

  const { mutate: computePotentialDuplicatesMutate } = useMutation({
    mutationFn: computePotentialDuplicates,
    onSuccess: ({ duplicate_checker_last_fetch_status: duplicateCheckerLastFetchStatus }) => {
      queryClient.setQueryData(
        ['potential-duplicates-data'],
        (oldData) => ({
          ...oldData,
          duplicate_checker_last_fetch_status: duplicateCheckerLastFetchStatus,
        }),
      );
    },
  });

  const {
    duplicate_checker_last_fetch_status: lastFetchedStatus,
    duplicate_checker_last_fetch_time: lastFetchedTime,
    similar_persons: similarPersons,
  } = data || {};

  if (isLoading) return <Loading />;
  if (isError) return <Errored />;

  return (
    <>
      <DuplicateCheckerHeader
        lastFetchedStatus={lastFetchedStatus}
        lastFetchedTime={lastFetchedTime}
        run={() => computePotentialDuplicatesMutate({ competitionId })}
      />
      <SimilarPersons similarPersons={similarPersons} />
    </>
  );
}
