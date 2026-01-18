import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Segment } from 'semantic-ui-react';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';
import computePotentialDuplicates from './api/computePotentialDuplicates';
import getLastDuplicateCheckerJobRun from './api/getLastDuplicateCheckerJobRun';
import SimilarPersons from './SimilarPersons';
import DuplicateCheckerHeader from './DuplicateCheckerHeader';
import { duplicateCheckerJobRunStatuses } from '../../lib/wca-data.js.erb';

export default function DuplicateChecker({ competitionId, setUserIdToEdit }) {
  const {
    data: lastDuplicateCheckerJobRun,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['last-duplicate-checker-job', competitionId],
    queryFn: () => getLastDuplicateCheckerJobRun({ competitionId }),
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

  if (isFetching) return <Loading />;
  if (isError) return <Errored error={error} />;

  return (
    <>
      <DuplicateCheckerHeader
        lastDuplicateCheckerJobRun={lastDuplicateCheckerJobRun}
        run={() => computePotentialDuplicatesMutate({ competitionId })}
        refetch={refetch}
      />
      {lastDuplicateCheckerJobRun.potential_duplicate_persons.length === 0 && (
        <Segment>No newcomers to show</Segment>
      )}
      {lastDuplicateCheckerJobRun.run_status === duplicateCheckerJobRunStatuses.success
      && (
        <SimilarPersons
          similarPersons={lastDuplicateCheckerJobRun.potential_duplicate_persons}
          competitionId={competitionId}
          setUserIdToEdit={setUserIdToEdit}
        />
      )}
    </>
  );
}
