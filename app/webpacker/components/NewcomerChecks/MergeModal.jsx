import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import MergeUsers from '../Panel/pages/MergeUsersPage/MergeUsers';
import AssignWcaIdToUser from '../Panel/views/AssignWcaIdToUser';

export default function MergeModal({
  potentialDuplicatePerson, competitionId, onMergeSuccess,
}) {
  const queryClient = useQueryClient();
  const {
    original_user: originalUser,
    duplicate_person: duplicatePerson,
  } = potentialDuplicatePerson;

  const action = duplicatePerson.user_id ? 'merge' : 'assign_wca_id';

  const clearUserIdsFromDuplicates = (ids) => {
    queryClient.setQueryData(
      ['last-duplicate-checker-job', competitionId],
      (previousData) => ({
        ...previousData,
        potential_duplicate_persons: previousData.potential_duplicate_persons.filter(
          (person) => !ids.includes(person.original_user_id),
        ),
      }),
    );
  };

  const onMergeUsersSuccess = (_, { fromUserId, toUserId }) => {
    clearUserIdsFromDuplicates([fromUserId, toUserId]);
    onMergeSuccess();
  };

  const onAssignSuccess = (_, { userId }) => {
    clearUserIdsFromDuplicates([userId]);
    onMergeSuccess();
  };

  if (action === 'assign_wca_id') {
    return (
      <AssignWcaIdToUser
        user={originalUser}
        prefilledWcaId={duplicatePerson.wca_id}
        onSuccess={onAssignSuccess}
        requireConfirmation
      />
    );
  }

  if (action === 'merge') {
    return (
      <MergeUsers
        firstUserId={originalUser.id}
        secondUserId={duplicatePerson.user_id}
        onSuccess={onMergeUsersSuccess}
        requireConfirmation
      />
    );
  }

  return null;
}
