import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import WCAQueryClientProvider from '../../lib/providers/WCAQueryClientProvider';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';
import computePotentialDuplicates from './api/computePotentialDuplicates';
import getLastDuplicateCheckerJob from './api/getLastDuplicateCheckerJob';
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
  const { data: lastDuplicateCheckerJob, isLoading, isError } = useQuery({
    queryKey: ['last-duplicate-checker-job', competitionId],
    queryFn: () => getLastDuplicateCheckerJob({ competitionId }),
  });

  const queryClient = useQueryClient();

  const { mutate: computePotentialDuplicatesMutate } = useMutation({
    mutationFn: computePotentialDuplicates,
    onSuccess: (newJob) => {
      queryClient.setQueryData(
        ['last-duplicate-checker-job', competitionId],
        () => newJob,
      );
    },
  });

  if (isLoading) return <Loading />;
  if (isError) return <Errored />;

  return (
    <>
      <DuplicateCheckerHeader
        lastDuplicateCheckerJob={lastDuplicateCheckerJob}
        run={() => computePotentialDuplicatesMutate({ competitionId })}
      />
      <SimilarPersons similarPersons={lastDuplicateCheckerJob.similar_persons} />
    </>
  );
}
