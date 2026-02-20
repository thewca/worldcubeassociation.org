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

  const onSuccess = (_, { fromUserId, toUserId }) => {
    queryClient.setQueryData(
      ['last-duplicate-checker-job', competitionId],
      (previousData) => ({
        ...previousData,
        potential_duplicate_persons: previousData.potential_duplicate_persons.filter(
          (person) => ![fromUserId, toUserId].includes(person.original_user_id),
        ),
      }),
    );
    onMergeSuccess();
  };

  if (!duplicatePerson.user_id) {
    return (
      <Message warning>
        Please go to user&apos;s edit page and add the WCA ID. Once done,
        {' '}
        {RESYNC_MESSAGE}
      </Message>
    );
  }

  return (
    <MergeUsers
      firstUserId={originalUser.id}
      secondUserId={duplicatePerson.user_id}
      onSuccess={onSuccess}
    />
  );
}
