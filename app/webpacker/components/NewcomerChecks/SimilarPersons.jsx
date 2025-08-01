import _ from 'lodash';
import React, { useState } from 'react';
import { Modal } from 'semantic-ui-react';
import { useQueryClient } from '@tanstack/react-query';
import SimilarPersonTable from './SimilarPersonTable';
import MergeModal from './MergeModal';
import EditUser from '../EditUser';

export default function SimilarPersons({ similarPersons, competitionId }) {
  const duplicatesByUserId = _.groupBy(similarPersons, 'original_user_id');
  const userIds = _.keys(duplicatesByUserId);

  const queryClient = useQueryClient();

  const [potentialDuplicatePerson, setPotentialDuplicatePerson] = useState();
  const [userIdToEdit, setUserIdToEdit] = useState();

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

  return (
    <>
      {userIds.map((userId) => (
        <SimilarPersonTable
          potentialDuplicates={duplicatesByUserId[userId]}
          editUser={setUserIdToEdit}
          mergePotentialDuplicate={setPotentialDuplicatePerson}
        />
      ))}
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
