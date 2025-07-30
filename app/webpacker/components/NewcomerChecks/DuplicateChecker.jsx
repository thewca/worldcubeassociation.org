import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from 'semantic-ui-react';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';
import computePotentialDuplicates from './api/computePotentialDuplicates';
import getLastDuplicateCheckerJobRun from './api/getLastDuplicateCheckerJobRun';
import SimilarPersons from './SimilarPersons';
import DuplicateCheckerHeader from './DuplicateCheckerHeader';
import MergeModal from './MergeModal';
import EditUser from '../EditUser';

export default function DuplicateChecker({ competitionId }) {
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

  const onUserEdit = (user) => {
    queryClient.setQueryData(
      ['last-duplicate-checker-job', competitionId],
      (previousData) => ({
        ...previousData,
        potential_duplicate_persons: (
          previousData.potential_duplicate_persons.map((person) => (
            person.original_user_id === user.id
              ? { ...person, original_user: user }
              : person
          ))),
      }),
    );
  };

  const [potentialDuplicatePerson, setPotentialDuplicatePerson] = useState();
  const [userIdToEdit, setUserIdToEdit] = useState();

  if (isFetching) return <Loading />;
  if (isError) return <Errored error={error} />;

  return (
    <>
      <DuplicateCheckerHeader
        lastDuplicateCheckerJobRun={lastDuplicateCheckerJobRun}
        run={() => computePotentialDuplicatesMutate({ competitionId })}
        refetch={refetch}
      />
      <SimilarPersons
        similarPersons={lastDuplicateCheckerJobRun.potential_duplicate_persons}
        mergePotentialDuplicate={setPotentialDuplicatePerson}
        editUser={setUserIdToEdit}
      />
      <Modal
        open={potentialDuplicatePerson}
        onClose={() => setPotentialDuplicatePerson(null)}
        closeIcon
      >
        <Modal.Header>Merge</Modal.Header>
        <Modal.Content>
          <MergeModal
            potentialDuplicatePerson={potentialDuplicatePerson}
            competitionId={competitionId}
          />
        </Modal.Content>
      </Modal>
      <Modal
        open={userIdToEdit}
        onClose={() => setUserIdToEdit(null)}
        closeIcon
      >
        <Modal.Header>Edit User</Modal.Header>
        <Modal.Content>
          <EditUser
            id={userIdToEdit}
            onSuccess={onUserEdit}
          />
        </Modal.Content>
      </Modal>
    </>
  );
}
