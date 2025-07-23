import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from 'semantic-ui-react';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';
import computePotentialDuplicates from './api/computePotentialDuplicates';
import getLastDuplicateCheckerJobRun from './api/getLastDuplicateCheckerJobRun';
import SimilarPersons from './SimilarPersons';
import DuplicateCheckerHeader from './DuplicateCheckerHeader';
import WCAQueryClientProvider from '../../lib/providers/WCAQueryClientProvider';
import MergeModal from './MergeModal';

export default function Wrapper({ competitionId }) {
  return (
    <WCAQueryClientProvider>
      <DuplicateChecker competitionId={competitionId} />
    </WCAQueryClientProvider>
  );
}

function DuplicateChecker({ competitionId }) {
  const { data: lastDuplicateCheckerJobRun, isLoading, isError } = useQuery({
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

  const [mergeModalOptions, setMergeModalOptions] = useState({
    isOpen: false,
  });

  if (isLoading) return <Loading />;
  if (isError) return <Errored />;

  return (
    <>
      <DuplicateCheckerHeader
        lastDuplicateCheckerJobRun={lastDuplicateCheckerJobRun}
        run={() => computePotentialDuplicatesMutate({ competitionId })}
      />
      <SimilarPersons
        similarPersons={lastDuplicateCheckerJobRun.potential_duplicate_persons}
        mergePotentialDuplicate={(potentialDuplicatePerson) => setMergeModalOptions({
          isOpen: true,
          potentialDuplicatePerson,
        })}
      />
      <Modal
        open={mergeModalOptions.isOpen}
        onClose={() => setMergeModalOptions({ isOpen: false })}
        closeIcon
      >
        <Modal.Header>Merge</Modal.Header>
        <Modal.Content>
          <MergeModal
            potentialDuplicatePerson={mergeModalOptions.potentialDuplicatePerson}
            competitionId={competitionId}
          />
        </Modal.Content>
      </Modal>
    </>
  );
}
