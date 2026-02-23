import React from 'react';
import { Message } from 'semantic-ui-react';
import { useQueryClient } from '@tanstack/react-query';
import MergeUsers from '../Panel/pages/MergeUsersPage/MergeUsers';
import { RESYNC_MESSAGE } from '../EditUser/EditUserForm';

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

  if (action === 'assign_wca_id') {
    return (
      <Message warning>
        Please go to user&apos;s edit page and add the WCA ID. Once done,
        {' '}
        {RESYNC_MESSAGE}
      </Message>
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
